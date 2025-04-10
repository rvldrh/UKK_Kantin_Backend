const mongoose = require('mongoose');


const transaksiSchema = new mongoose.Schema({
    tanggal: {
        type: Date,
        required: true,
        default: Date.now
    },
    id_stan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stan',
        required: true
    },
    id_siswa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Siswa',
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    total_akhir: {
        type: Number,
        required: true
    },
    diskon: {
        nama_diskon: String,
        persentase: Number,
        potongan: Number
    },
    status: {
        type: String,
        enum: ['belum dikonfirm', 'dimasak', 'diantar', 'sampai'],
        default: 'belum dikonfirm'
    }
});


const detailTransaksiSchema = new mongoose.Schema({
    id_transaksi: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaksi',
        required: true
    },
    id_menu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    harga_beli: {
        type: Number,
        required: true
    }
});


const menuSchema = new mongoose.Schema({
    nama_makanan: {
        type: String,
        required: true,
        maxLength: 100
    },
    harga: {
        type: Number,
        required: true
    },
    jenis: {
        type: String,
        enum: ['makanan', 'minuman'],
        required: true
    },
    foto: {
        type: String,
        required: true,
    },
    deskripsi: {
        type: String
    },
    id_stan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stan',
        required: true
    },
    id_diskon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Diskon',
        default: null,
        required: false
    }
});


const siswaSchema = new mongoose.Schema({
    nama_siswa: {
        type: String,
        required: true,
        maxLength: 100
    },
    alamat: {
        type: String,
        required: true
    },
    telp: {
        type: String,
        required: true,
        maxLength: 20
    },
    foto: {
        type: String,
        maxLength: 255
    },
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});


const stanSchema = new mongoose.Schema({
    nama_stan: {
        type: String,
        required: true,
        maxLength: 100
    },
    nama_pemilik: {
        type: String,
        required: true,
        maxLength: 100
    },
    telp: {
        type: String,
        required: true,
        maxLength: 20
    },
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxLength: 100
    },
    password: {
        type: String,
        required: true,
        maxLength: 100,
        select: false
    },
    role: {
        type: String,
        enum: ['admin_stan', 'siswa'],
        required: true
    }
});


const diskonSchema = new mongoose.Schema({
    nama_diskon: {
        type: String,
        required: [true, 'Nama diskon harus diisi'],
        maxLength: 100
    },
    persentase_diskon: {
        type: Number,
        required: [true, 'Persentase diskon harus diisi'],
        min: [0, 'Persentase minimal 0'],
        max: [100, 'Persentase maksimal 100']
    },
    tanggal_awal: {
        type: Date,
        required: [true, 'Tanggal awal harus diisi']
    },
    tanggal_akhir: {
        type: Date,
        required: [true, 'Tanggal akhir harus diisi']
    }, 
    id_stan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stan',
        required: [true, 'ID Stan harus diisi']
    }
}, {
    timestamps: true 
});


diskonSchema.pre('save', function(next) {
    if (this.tanggal_akhir < this.tanggal_awal) {
        next(new Error('Tanggal akhir tidak boleh lebih awal dari tanggal awal'));
    }
    next();
});


const models = {
    User: mongoose.model('User', userSchema),
    Siswa: mongoose.model('Siswa', siswaSchema),
    Stan: mongoose.model('Stan', stanSchema),
    Menu: mongoose.model('Menu', menuSchema),
    Transaksi: mongoose.model('Transaksi', transaksiSchema),
    DetailTransaksi: mongoose.model('DetailTransaksi', detailTransaksiSchema),
    Diskon: mongoose.model('Diskon', diskonSchema)
};


models.createTransaksi = async (req, res) => {
    try {
        const { detail_pesanan } = req.body;
        if (!detail_pesanan || !Array.isArray(detail_pesanan)) {
            return res.status(400).json({
                status: 'error',
                message: 'Detail pesanan harus diisi'
            });
        }
        const menuDetails = await Promise.all(
            detail_pesanan.map(item =>
                Menu.findById(item.id_menu)
            )
        );

        const stanId = menuDetails[0].id_stan;
        const isAllSameStan = menuDetails.every(menu =>
            menu.id_stan.toString() === stanId.toString()
        );

        if (!isAllSameStan) {
            return res.status(400).json({
                status: 'error',
                message: 'Semua menu harus dari stan yang sama'
            });
        }
        let total = 0;
        detail_pesanan.forEach((item, index) => {
            total += menuDetails[index].harga * item.qty;
        });
        const today = new Date();
        const availableDiskon = await Diskon.findOne({
            id_stan: stanId,
            tanggal_awal: { $lte: today },
            tanggal_akhir: { $gte: today }
        });
        let total_akhir = total;
        let diskonInfo = null;

        if (availableDiskon) {
            const potongan = (total * availableDiskon.persentase_diskon) / 100;
            total_akhir = total - potongan;
            diskonInfo = {
                nama_diskon: availableDiskon.nama_diskon,
                persentase: availableDiskon.persentase_diskon,
                potongan: potongan
            };
        }

        const tanggal = new Date();
        const id_stan = stanId;
        const id_siswa = req.user.id_siswa;
        const transaksi = new Transaksi({
            tanggal,
            id_stan,
            id_siswa,
            total,
            total_akhir,
            diskon: diskonInfo,
            status: 'belum dikonfirm'
        });

        await transaksi.save();

        const detailTransaksi = detail_pesanan.map(item => ({
            id_transaksi: transaksi._id,
            id_menu: item.id_menu,
            qty: item.qty,
            harga_beli: menuDetails.find(m =>
                m._id.toString() === item.id_menu.toString()
            ).harga
        }));

        await DetailTransaksi.insertMany(detailTransaksi);

        res.status(201).json({
            status: 'success',
            data: {
                transaksi,
                detail: detailTransaksi
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = models; 