const express = require('express');
const router = express.Router();
const detailTransaksiController = require('../controllers/detailTransaksiController');

router.get('/', detailTransaksiController.getAllDetailTransaksi);
router.get('/:id_transaksi', detailTransaksiController.getDetailTransaksi);
router.post('/', detailTransaksiController.createDetailTransaksi);
router.put('/:id_transaksi', detailTransaksiController.updateDetailTransaksi);
router.delete('/:id_transaksi', detailTransaksiController.deleteDetailTransaksi);

module.exports = router;