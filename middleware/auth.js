const jwt = require('jsonwebtoken');
const { User, Siswa } = require('../models/main.model');

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Silakan login terlebih dahulu'
            });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User tidak ditemukan'
            });
        }
        if (user.role === 'siswa') {
            const siswa = await Siswa.findOne({ id_user: user._id });
            if (siswa) {
                req.user = {
                    id: user._id,
                    role: user.role,
                    username: user.username,
                    id_siswa: siswa._id,
                    nama_siswa: siswa.nama_siswa
                };
            }
        } else {
            req.user = {
                id: user._id,
                role: user.role,
                username: user.username
            };
        }

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token tidak valid'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token sudah kadaluarsa'
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Anda tidak memiliki akses untuk melakukan aksi ini'
            });
        }
        next();
    };
};

exports.isSiswa = (req, res, next) => {
    if (req.user.role !== 'siswa' || !req.user.id_siswa) {
        return res.status(403).json({
            status: 'error',
            message: 'Aksi ini hanya untuk siswa'
        });
    }
    next();
};


exports.isAdminStan = (req, res, next) => {
    if (req.user.role !== 'admin_stan') {
        return res.status(403).json({
            status: 'error',
            message: 'Aksi ini hanya untuk admin stan'
        });
    }
    next();
}; 
exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Autentikasi gagal' });
  }
};

exports.checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    next();
  };
}; 