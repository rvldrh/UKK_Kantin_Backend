const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:/vsc/XI_Materi_Sekolah/UKK_12_Kantin/ukk_kantin_frontend/public/img/siswaImg");
  },
  filename: (req, file, cb) => {
    const fileName = "siswa-image-" + Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
