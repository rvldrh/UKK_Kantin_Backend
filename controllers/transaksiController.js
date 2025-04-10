const {
  Transaksi,
  DetailTransaksi,
  Menu,
  Diskon,
  User,
  Stan,
  Siswa

} = require("../models/main.model");

const { ObjectId } = require('mongodb');

const getActiveDiskon = async (tanggal, id_stan) => {
  try {
    const diskon = await Diskon.findOne({
      id_stan: id_stan,
      tanggal_awal: { $lte: tanggal },
      tanggal_akhir: { $gte: tanggal },
    });
    return diskon;
  } catch (error) {
    console.error("Error getting active diskon:", error);
    return null;
  }
};


exports.getAllTransaksi = async (req, res) => {
  try {
    const idStan = await Stan.findOne({ id_user: req.user.id });
    
    if (!idStan) {
      return res.status(404).json({
        status: "error",
        message: "ID stan tidak ditemukan",
      });
    }
    
    const transaksi = await Transaksi.find()
    .where("id_stan").equals(idStan._id)
    .populate("id_stan")
    .populate("id_siswa");

    const detailTransaksi = await DetailTransaksi.find()
      .where("id_transaksi").equals(transaksi._id)
      .populate("id_menu")
      .populate("id_transaksi");


    res.json({
      status: "success",
      data: {
        transaksi,
        detailTransaksi,
      },
    });
  } catch (error) {
    console.error("Error getAllTransaksi:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getTransaksiByIdSiswa = async (req, res) => {
  try {
    const idUser = req.user.id;

    const siswa = await Siswa.findOne({ id_user: idUser });
    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan",
      });
    }

    const transaksi = await Transaksi.find({ id_siswa: siswa._id })
      .populate("id_stan")
      .populate("id_siswa");

    res.json({
      status: "success",
      data: transaksi,
    });
  } catch (error) {
    console.error("Error getTransaksiByIdSiswa:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


exports.createTransaksi = async (req, res) => {
  try {
    const { detail_pesanan } = req.body;

    if (!detail_pesanan || !Array.isArray(detail_pesanan)) {
      return res.status(400).json({
        status: "error",
        message: "Detail pesanan harus diisi",
      });
    }

    const siswa = await Siswa.findOne({ id_user: req.user.id });
    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan",
      });
    }

    const menuDetails = await Promise.all(
      detail_pesanan.map((item) => Menu.findById(item.id_menu).populate("id_diskon"))
    );

    let total = 0;
    let total_akhir = 0;
    
    const detailTransaksi = detail_pesanan.map((item, index) => {
      let menu = menuDetails[index];
      let hargaAsli = menu.harga;
      let potongan = 0;
      let id_diskon = null;

      if (menu.id_diskon) {
        const today = new Date();
        const startDate = new Date(menu.id_diskon.tanggal_awal);
        const endDate = new Date(menu.id_diskon.tanggal_akhir);
        
        if (startDate <= today && endDate >= today) {
          potongan = (menu.id_diskon.persentase_diskon / 100) * hargaAsli;
          id_diskon = menu.id_diskon;
        }
      }

      let hargaBeli = hargaAsli * item.qty - potongan * item.qty;
      total += hargaAsli * item.qty;
      total_akhir += hargaBeli;

      return {
        id_menu: item.id_menu,
        qty: item.qty,
        harga_satuan: hargaAsli,
        harga_beli: hargaBeli,
        id_stan: menu.id_stan,
        diskon: id_diskon
          ? {
              nama_diskon: id_diskon.nama_diskon,
              persentase: id_diskon.persentase_diskon,
              potongan: potongan * item.qty,
            }
          : null,
      };
    });

    const transaksi = new Transaksi({
      tanggal: new Date(),
      id_siswa: siswa._id,
      id_stan: menuDetails[0].id_stan,
      total,
      total_akhir,
      status: "belum dikonfirm",
    });

    await transaksi.save();
    await DetailTransaksi.insertMany(
      detailTransaksi.map((item) => ({ ...item, id_transaksi: transaksi._id }))
    );

    res.status(201).json({
      status: "success",
      data: {
        transaksi,
        detail: detailTransaksi,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};





exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["belum dikonfirm", "dimasak", "diantar", "sampai"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Status tidak valid",
      });
    }

    const transaksi = await Transaksi.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("id_siswa")
      .populate("id_stan");

    if (!transaksi) {
      return res.status(404).json({
        status: "error",
        message: "Transaksi tidak ditemukan",
      });
    }

    const details = await DetailTransaksi.find({ id_transaksi: id }).populate(
      "id_menu"
    );

    res.status(200).json({
      status: "success",
      data: {
        transaksi,
        details,
      },
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getTransaksiBulanAdmin = async (req, res) => {
  try {
    const { bulan } = req.params;
    if (!bulan || isNaN(bulan)) {
      return res.status(400).json({
        status: "error",
        message: "Bulan harus diisi dan berupa angka",
      });
    }

    const idStan = await Stan.findOne({ id_user: req.user.id });
    const transaksi = await Transaksi.find()
      .populate("id_stan")
      .populate("id_siswa")
      .where({
        tanggal: {
          $gte: new Date(
            new Date().getFullYear(),
            parseInt(bulan) - 1,
            1
          ).toISOString(),
          $lte: new Date(new Date().getFullYear(), parseInt(bulan), 0).toISOString()
        },
        id_stan: idStan._id
      });

    if (transaksi.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada data transaksi untuk bulan ini",
      });
    }

    res.json(transaksi);
  } catch (error) {
    console.error("Error getTransaksiBulan:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getTransaksiBulanSiwa = async (req, res) => {
  try {
    const { bulan } = req.params;
    if (!bulan || isNaN(bulan)) {
      return res.status(400).json({
        status: "error",
        message: "Bulan harus diisi dan berupa angka",
      });
    }

    const idSiswa = await Siswa.findOne({ id_user: req.user.id });

    const transaksi = await Transaksi.find()
      .populate("id_stan")
      .populate("id_siswa") 
      .where({
        tanggal: {
          $gte: new Date(
            new Date().getFullYear(),
            parseInt(bulan) - 1,
            1
          ).toISOString(),
          $lte: new Date(new Date().getFullYear(), parseInt(bulan), 0).toISOString()
        },
        id_siswa: idSiswa.id_user,
      })
      
    if (transaksi.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada data transaksi untuk bulan ini",
      });
    }

    res.json(transaksi);
  } catch (error) {
    console.error("Error getTransaksiBulan:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getRekapPemasukanBulan = async (req, res) => {
  try {
    const { bulan } = req.params;
    if (!bulan || isNaN(bulan)) {
      return res.status(400).json({
        status: "error",
        message: "Bulan harus diisi dan berupa angka",
      });
    }

    const idStan = await Stan.findOne({ id_user: req.user.id });
    if (!idStan) {
      return res.status(404).json({
        status: "error",
        message: "Stan tidak ditemukan",
      });
    }

    const tahunSekarang = new Date().getFullYear();
    const bulanInt = parseInt(bulan) - 1;

    const tanggalAwal = new Date(tahunSekarang, bulanInt, 1, 0, 0, 0);
    const tanggalAkhir = new Date(tahunSekarang, bulanInt + 1, 0, 23, 59, 59);

    const rekapPemasukan = await Transaksi.find({
      tanggal: { $gte: tanggalAwal, $lte: tanggalAkhir },
      id_stan: idStan._id,
    })
      .populate("id_stan")
      .populate("id_siswa");

    if (rekapPemasukan.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada data transaksi untuk bulan ini",
      });
    }

    const totalPemasukan = rekapPemasukan.reduce((total, transaksi) => {
      return total + (transaksi.total_akhir || 0);
    }, 0);

    res.json({
      total_pemasukan: totalPemasukan,
      transaksi: rekapPemasukan,
    });
  } catch (error) {
    console.error("Error getRekapPemasukanBulan:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


exports.getTransaksiByStan = async (req, res) => {
  try {
    const idUser = req.user.id;
    const stan = await Stan.findOne({ id_user: idUser });
    if (!stan) {
      return res.status(404).json({
        status: "error",
        message: "Stan tidak ditemukan",
      });
    }

    const transaksi = await Transaksi.find({ id_stan: stan._id })
    .populate({ path: "id_stan", select: "nama_stan nama_pemilik" })
    .populate({ path: "id_siswa", select: "nama_siswa" });

    res.json({ transaksi });
  } catch (error) {
    console.error("Error getTransaksiByStan:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};  

exports.deleteTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const transaksi = await Transaksi.findById(id);
    if (!transaksi) {
      return res.status(404).json({ 
        status: "error", 
        message: "Transaksi tidak ditemukan" 
      });
    }
    await transaksi.deleteOne();
    res.json({
      status: "success",
      message: "Transaksi berhasil dihapus"
    });
  } catch (error) {
    console.error("Error deleteTransaksi:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};



