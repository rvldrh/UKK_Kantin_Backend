const { DetailTransaksi } = require('../models/main.model');


exports.getAllDetailTransaksi = async (req, res) => {
  try {
    const detailTransaksi = await DetailTransaksi.find()
      .populate('id_menu')
      .populate('id_transaksi');
    if (!detailTransaksi.length) { 
      return res.status(404).json({
        status: 'error',
        message: 'Detail Transaksi tidak ditemukan'
      });
    }
    res.json({
      status: 'success',
      data: detailTransaksi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
};

exports.getDetailTransaksi = async (req, res) => {
  try {
    const id_transaksi = req.params.id_transaksi;
    const detailTransaksi = await DetailTransaksi.find({ id_transaksi: id_transaksi })
      .populate('id_menu')
      .populate('id_transaksi');

    if (!detailTransaksi.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Detail Transaksi tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      data: detailTransaksi
    });
  } catch (error) {
    console.error('Error getDetailTransaksi:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.createDetailTransaksi = async (req, res) => {
  try {
    const detailTransaksi = new DetailTransaksi(req.body);
    await detailTransaksi.save();

    res.json({
      status: 'success',
      data: detailTransaksi
    });
  } catch (error) {
    console.error('Error createDetailTransaksi:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateDetailTransaksi = async (req, res) => {
  try {
    const id_transaksi = req.params.id_transaksi;
    await DetailTransaksi.findOneAndUpdate({ id_transaksi: id_transaksi }, req.body);

    res.json({
      status: 'success',
      message: 'Detail Transaksi berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updateDetailTransaksi:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteDetailTransaksi = async (req, res) => {
  try {
    const id_transaksi = req.params.id_transaksi;
    await DetailTransaksi.findOneAndRemove({ id_transaksi: id_transaksi });

    res.json({
      status: 'success',
      message: 'Detail Transaksi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleteDetailTransaksi:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};