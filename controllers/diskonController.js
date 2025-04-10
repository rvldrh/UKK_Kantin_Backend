const { Diskon, Stan } = require("../models/main.model");

exports.getActiveDiskon = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  

    const activeDiskons = await Diskon.find({
      tanggal_awal: { $lte: today }, 
      tanggal_akhir: { $gte: today }, 
    }).populate("id_stan");

    if (activeDiskons.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada diskon yang aktif hari ini",
      });
    }

    res.status(200).json({
      status: "success",
      data: activeDiskons,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getAllDiskon = async (req, res) => {
  try {
    const diskon = await Diskon.find().populate("id_stan");
    res.status(200).json({
      status: "success",
      data: diskon,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const today = new Date().toISOString(); 

exports.getAllDiskonSiswa = async (req, res) => {
  try {
    const diskon = await Diskon.find({
      tanggal_awal: { $lte: today }, 
      tanggal_akhir: { $gte: today }, 
    }).populate("id_stan");

    if (diskon.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada diskon yang berlaku hari ini",
      });
    }

    res.status(200).json({
      status: "success",
      data: diskon,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createDiskon = async (req, res) => {
  try {
    const { nama_diskon, persentase_diskon, tanggal_awal, tanggal_akhir } =
      req.body;

    const adminStanId = req.user.id;

    const stan = await Stan.findOne({ id_user: adminStanId });
    if (!stan) {
      return res.status(404).json({
        status: "error",
        message: "Stan tidak ditemukan",
      });
    }

    if (!nama_diskon || !persentase_diskon || !tanggal_awal || !tanggal_akhir) {
      return res.status(400).json({
        status: "error",
        message: "Semua field harus diisi",
      });
    }

    const tglAwal = new Date(tanggal_awal);
    const tglAkhir = new Date(tanggal_akhir);

    if (tglAkhir < tglAwal) {
      return res.status(400).json({
        status: "error",
        message: "Tanggal akhir tidak boleh lebih awal dari tanggal awal",
      });
    }

    const diskon = await Diskon.create({
      nama_diskon,
      persentase_diskon,
      tanggal_awal: tglAwal,
      tanggal_akhir: tglAkhir,
      id_stan: stan._id,
    });

    const result = await Diskon.findById(diskon._id).populate("id_stan");

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Create Diskon Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getDiskonStan = async (req, res) => {
  try {
    const adminStanId = req.user.profileId;

    const diskon = await Diskon.find({ id_stan: adminStanId })
      .populate("id_stan")
      .sort({ tanggal_awal: -1 });

    res.status(200).json({
      status: "success",
      data: diskon,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateDiskon = async (req, res) => {
  try {
    const { id } = req.params;
    const adminStanId = req.user.id;

    const existingDiskon = await Diskon.findOne({
      _id: id,
      id_stan: adminStanId,
    });

    if (!existingDiskon) {
      return res.status(404).json({
        status: "error",
        message: "Diskon tidak ditemukan atau bukan milik stan Anda",
      });
    }

    if (req.body.id_stan === "") {
      req.body.id_stan = null;
    }

    const updatedDiskon = await Diskon.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate("id_stan");

    res.status(200).json({
      status: "success",
      data: updatedDiskon,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteDiskon = async (req, res) => {
  try {
    const { id } = req.params;
    const adminStanId = req.user.profileId;
    const diskon = await Diskon.findOne({
      _id: id,
      id_stan: adminStanId,
    });

    if (!diskon) {
      return res.status(404).json({
        status: "error",
        message: "Diskon tidak ditemukan atau bukan milik stan Anda",
      });
    }

    await Diskon.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Diskon berhasil dihapus",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getDiskonByStanId = async (req, res) => {
    try {
      const adminStanId = req.user.id;
      const today = new Date();
  
      const stan = await Stan.findOne({ id_user: adminStanId });
      if (!stan) {
        return res.status(404).json({
          status: "error",
          message: "Stan tidak ditemukan",
        });
      }
  
      const diskon = await Diskon.find({
        id_stan: stan._id,
        tanggal_awal: { $lte: today },
        tanggal_akhir: { $gte: today },
      }).populate("id_stan");
  
      if (!diskon || diskon.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Tidak ada diskon yang berlaku untuk stan ini",
        });
      }
  
      res.status(200).json({
        status: "success",
        data: diskon,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  };
  
