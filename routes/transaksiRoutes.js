const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, transaksiController.getAllTransaksi);
router.post('/', authMiddleware, checkRole('siswa'),transaksiController.createTransaksi);
router.patch('/status/:id', authMiddleware, checkRole('admin_stan'),transaksiController.updateStatus);
router.get('/siswa', authMiddleware, checkRole('siswa'), transaksiController.getTransaksiByIdSiswa);
router.get('/bulan/:bulan', authMiddleware, checkRole('admin_stan'),transaksiController.getTransaksiBulanAdmin);
router.get('/bulanSiswa/:bulan',transaksiController.getTransaksiBulanSiwa);
router.get('/pemasukan/:bulan', authMiddleware, checkRole('admin_stan'),transaksiController.getRekapPemasukanBulan);
router.get('/stan', authMiddleware, checkRole('admin_stan'),transaksiController.getTransaksiByStan);
router.delete('/:id', authMiddleware, checkRole('admin_stan'),transaksiController.deleteTransaksi);

module.exports = router;