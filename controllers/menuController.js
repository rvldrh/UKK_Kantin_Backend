const { Menu, Stan } = require("../models/main.model");

exports.getAllMenu = async (req, res) => {
  try {
    const menu = await Menu.find().populate("id_stan").populate("id_diskon");
    res.status(200).json({
      status: "success",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const adminStanId = req.user.id;
    const stan = await Stan.findOne({ id_user: adminStanId });

    if (!stan) {
      return res.status(404).json({ message: "Stan tidak ditemukan" });
    }

    if (!req.body.nama_makanan || !req.body.harga || !req.body.jenis) {
      return res
        .status(400)
        .json({ message: "Nama, harga, dan jenis wajib diisi" });
    }

    const newMenu = new Menu({
      nama_makanan: req.body.nama_makanan,
      harga: req.body.harga,
      jenis: req.body.jenis,
      deskripsi: req.body.deskripsi,
      foto: req.file ? req.file.filename : null,
      id_stan: stan._id,
      id_diskon: req.body.id_diskon || null, 
    });

    await newMenu.save();
    res.status(201).json(newMenu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
      const { id } = req.params;
      const updateData = req.body;

      // Pastikan id_diskon diubah jadi null jika kosong
      if (updateData.id_diskon === "") {
          updateData.id_diskon = null;
      }

      // Jika ada file baru, update path foto hanya dengan nama file
      if (req.file) {
          updateData.foto = req.file.filename;  // Hanya menyimpan nama file
      }

      const updatedMenu = await Menu.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
      );

      if (!updatedMenu) {
          return res.status(404).json({ status: 'error', message: 'Menu tidak ditemukan' });
      }

      res.status(200).json({ status: 'success', data: updatedMenu });
  } catch (error) {
      console.error('Update Menu Error:', error);
      res.status(400).json({ status: 'error', message: error.message });
  }
};





exports.deleteMenu = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
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

exports.getMenuWithDiskon = async (req, res) => {
  try {
    const menus = await Menu.find().populate("id_stan", "nama_stan").populate("id_diskon");

    const menusWithDiskon = menus.map((menu) => {
      const menuObj = menu.toObject();
      const diskon = menuObj.id_diskon;
      
      if (diskon) {
        const hargaAsli = menuObj.harga;
        const potonganDiskon = (hargaAsli * diskon.persentase_diskon) / 100;
        const hargaSetelahDiskon = hargaAsli - potonganDiskon;

        return {
          ...menuObj,
          diskon: {
            nama_diskon: diskon.nama_diskon,
            persentase: diskon.persentase_diskon,
            harga_asli: hargaAsli,
            harga_setelah_diskon: hargaSetelahDiskon,
            potongan: potonganDiskon,
            berlaku_sampai: diskon.tanggal_akhir,
          },
        };
      }
      return menuObj;
    });

    res.status(200).json({
      status: "success",
      data: menusWithDiskon,
    });
  } catch (error) {
    console.error("Get Menu With Diskon Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getMenuByStan = async (req, res) => {
  try {
    const adminId = req.user.id;
    const stan = await Stan.findOne({ id_user: adminId });
    if (!stan) {
      return res.status(404).json({
        status: "error",
        message: "Stan tidak ditemukan",
      });
    }

    const menus = await Menu.find({ id_stan: stan._id }).populate("id_stan", "nama_stan").populate("id_diskon");

    const menusWithDiskon = menus.map((menu) => {
      const menuObj = menu.toObject();
      const diskon = menuObj.id_diskon;

      if (diskon) {
        const hargaAsli = menuObj.harga;
        const potonganDiskon = (hargaAsli * diskon.persentase_diskon) / 100;
        const hargaSetelahDiskon = hargaAsli - potonganDiskon;

        return {
          ...menuObj,
          diskon: {
            nama_diskon: diskon.nama_diskon,
            persentase: diskon.persentase_diskon,
            harga_asli: hargaAsli,
            harga_setelah_diskon: hargaSetelahDiskon,
            potongan: potonganDiskon,
            berlaku_sampai: diskon.tanggal_akhir,
          },
        };
      }
      return menuObj;
    });

    res.status(200).json({
      status: "success",
      data: menusWithDiskon,
    });
  } catch (error) {
    console.error("Get Menu By Stan Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const { id_menu } = req.params;

    if (!id_menu) {
      return res.status(400).json({
        status: "error",
        message: "ID menu harus disertakan",
      });
    }

    const menu = await Menu.findById(id_menu).populate("id_stan").populate("id_diskon");

    if (!menu) {
      return res.status(404).json({
        status: "error",
        message: "Menu tidak ditemukan",
      });
    }

    res.status(200).json({
      status: "success",
      data: menu,
    });
  } catch (error) {
    console.error("Error getMenuById:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
