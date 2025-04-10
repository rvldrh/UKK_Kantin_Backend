const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const { authMiddleware, checkRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:/vsc/XI_Materi_Sekolah/UKK_12_Kantin/ukk_kantin_frontend/public/img/menuImg");
  }, 
  filename: (req, file, cb) => {
    const fileName = "menu-image-" + Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

router.get('/', authMiddleware, menuController.getAllMenu);
router.get('/with-diskon', authMiddleware, menuController.getMenuWithDiskon);
router.get('/stan/:stanId', authMiddleware, menuController.getMenuByStan);
router.get('/:id', authMiddleware, menuController.getMenuById);
router.get('/stan/pemilik', authMiddleware, checkRole('admin_stan'), menuController.getMenuByStan);

router.patch('/:id', 
  authMiddleware, 
  checkRole('admin_stan'), 
  upload.single('foto'), 
  menuController.updateMenu
);

router.delete('/:id', authMiddleware, checkRole('admin_stan'), menuController.deleteMenu);
router.post('/', upload.single('foto'), authMiddleware, checkRole("admin_stan"), menuController.createMenu);

module.exports = router;
