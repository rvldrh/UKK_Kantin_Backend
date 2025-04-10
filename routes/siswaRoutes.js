const express = require("express");
const router = express.Router();
const siswaController = require("../controllers/siswaController");
const { authMiddleware, checkRole } = require("../middleware/auth");
const upload = require("../middleware/uploadSiswa");

router.get("/", authMiddleware, checkRole("admin_stan"), siswaController.getAllSiswa);
router.get("/:id", authMiddleware, checkRole("siswa"), siswaController.getSiswaById);
router.post("/", upload.single("foto"), siswaController.createSiswa);
router.patch("/:id", authMiddleware, checkRole("admin_stan"), siswaController.updateSiswa);
router.patch("/update-foto/:id", authMiddleware, checkRole("siswa"), upload.single("foto"), siswaController.updateSiswaFoto);
router.delete("/:id", authMiddleware, checkRole("admin_stan"), siswaController.deleteSiswa);
router.patch("/updateSiswa/:id", authMiddleware, checkRole("siswa"),siswaController.updateSiswaData);


module.exports = router;
