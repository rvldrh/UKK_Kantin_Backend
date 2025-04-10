const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const authRoutes = require('./routes/authRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const menuRoutes = require('./routes/menuRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const stanRoutes = require('./routes/stanRoutes');
const diskonRoutes = require('./routes/diskonRoutes');
const detailTransaksi = require('./routes/detailTransaksiRoute');

const { protect } = require('./middleware/auth');

const allowedOrigins = ["http://localhost:3000"];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is running on port 5000!");
});
app.use('/auth', authRoutes);
app.use('/transaksi', protect, transaksiRoutes);
app.use('/menu', protect, menuRoutes);
app.use('/stan', protect, stanRoutes);
app.use('/diskon', protect, diskonRoutes);
app.use('/detailTransaksi', protect, detailTransaksi);

app.use('/siswa', protect, (req, res, next) => {
  if (req.user.role === 'admin_stan' || 
      (req.user.role === 'siswa' && req.params.id === req.user.profileId)) {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'You do not have permission to perform this action'
    });
  }
}, siswaRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

mongoose
  .connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
