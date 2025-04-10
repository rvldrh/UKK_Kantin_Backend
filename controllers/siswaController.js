const { Siswa, User } = require("../models/main.model");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

exports.getAllSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.find().populate("id_user", "username");
    res.status(200).json({
      status: "success",
      data: siswa,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createSiswa = async (req, res) => {
  try {
    const { username, password, nama_siswa, alamat, telp } = req.body;
    const foto = req.file ? req.file.filename : null;

    const requiredFields = [
      "username",
      "password",
      "nama_siswa",
      "alamat",
      "telp",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Field berikut harus diisi: ${missingFields.join(", ")}`,
      });
    }

    if (username.length < 4) {
      return res
        .status(400)
        .json({ status: "error", message: "Username minimal 4 karakter" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ status: "error", message: "Password minimal 6 karakter" });
    }

    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(telp)) {
      return res.status(400).json({
        status: "error",
        message: "Nomor telepon tidak valid (10-13 digit)",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username sudah digunakan",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.create(
        [
          {
            username,
            password: hashedPassword,
            role: "siswa",
          },
        ],
        { session }
      );

      const siswa = await Siswa.create(
        [
          {
            nama_siswa,
            alamat,
            telp,
            foto,
            id_user: user[0]._id,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        status: "success",
        message: "Data siswa berhasil ditambahkan",
        data: { user: user[0], siswa: siswa[0] },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_siswa, alamat, telp } = req.body;
    let updateData = { nama_siswa, alamat, telp };

    if (req.file) {
      updateData.foto = req.file.filename;
    }

    const siswa = await Siswa.findByIdAndUpdate(id, updateData, { new: true });

    if (!siswa) {
      return res
        .status(404)
        .json({ status: "error", message: "Siswa tidak ditemukan" });
    }

    res.status(200).json({ status: "success", data: siswa });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
exports.getSiswaById = async (req, res) => {
  try {
    const { id } = req.params;

    const siswa = await Siswa.findById(id).populate("id_user", "username");

    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan",
      });
    }

    res.status(200).json({
      status: "success",
      data: siswa,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteSiswa = async (req, res) => {
  try {
    await Siswa.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateSiswaFoto = async (req, res) => {
  try {
    const { id } = req.params;

    // Tunggu hingga Multer selesai memproses file
    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        status: "error",
        message: "File foto tidak ditemukan",
      });
    }

    const foto = req.file.filename;

    const siswa = await Siswa.findByIdAndUpdate(
      id,
      { foto },
      { new: true }
    );

    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Foto siswa berhasil diperbarui",
      data: siswa,
    });

  } catch (error) {
    console.error("Error saat update foto:", error); // Debugging
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memperbarui foto.",
    });
  }
};

exports.updateSiswaData = async (req, res) => {
  try {
    const { id } = req.params; 
    const { nama_siswa, alamat, telp } = req.body; 

    const siswa = await Siswa.findById(id);
    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan",
      });
    }

    siswa.nama_siswa = nama_siswa || siswa.nama_siswa;
    siswa.alamat = alamat || siswa.alamat;
    siswa.telp = telp || siswa.telp;

    await siswa.save();

    return res.status(200).json({
      status: "success",
      message: "Data siswa berhasil diperbarui",
      data: siswa,
    });
  } catch (error) {
    console.error("Error saat update data siswa:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memperbarui data siswa.",
    });
  }
};
 


























