const express = require('express');
const router = express.Router();
const diskonController = require('../controllers/diskonController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.post('/', authMiddleware, diskonController.createDiskon);
router.get('/', authMiddleware,diskonController.getAllDiskon);
router.get('/active', authMiddleware,diskonController.getActiveDiskon);
router.get('/siswa', authMiddleware,checkRole("siswa"),diskonController.getAllDiskonSiswa);
router.patch('/:id', authMiddleware, checkRole("admin_stan"),diskonController.updateDiskon);
router.delete('/:id', authMiddleware, checkRole("admin_stan"),diskonController.deleteDiskon);
router.get('/stan', authMiddleware, checkRole("admin_stan"),diskonController.getDiskonByStanId);

module.exports = router; 