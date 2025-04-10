const { User, Siswa, Stan } = require('../models/main.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, role, ...additionalData } = req.body;

        const requiredFields = ['username', 'password', 'role', 'alamat', 'telp'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (role === 'siswa' && !additionalData.nama_siswa) {
            missingFields.push('nama_siswa');
        } else if (role === 'admin_stan' && !additionalData.nama_stan) {
            missingFields.push('nama_stan');
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Field berikut harus diisi: ${missingFields.join(', ')}`
            });
        }

        if (username.length < 4) {
            return res.status(400).json({
                status: 'error',
                message: 'Username minimal 4 karakter'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password minimal 6 karakter'
            });
        }

        const phoneRegex = /^[0-9]{10,13}$/;
        if (!phoneRegex.test(additionalData.telp)) {
            return res.status(400).json({
                status: 'error',
                message: 'Nomor telepon tidak valid (10-13 digit)'
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Username sudah digunakan'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const session = await User.startSession();
        session.startTransaction();

        try {
            const user = await User.create([{
                username,
                password: hashedPassword,
                role
            }], { session });

            if (role === 'siswa') {
                await Siswa.create([{
                    ...additionalData,
                    id_user: user[0]._id
                }], { session });
            } else if (role === 'admin_stan') {
                await Stan.create([{
                    ...additionalData,
                    id_user: user[0]._id
                }], { session });
            }

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                status: 'success',
                message: 'Registrasi berhasil'
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        console.log('Input password:', password);
        console.log('Stored hashed password:', user.password);

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValidPassword);

        if (!isValidPassword) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        let profileData = null;
        if (user.role === 'siswa') {
            profileData = await Siswa.findOne({ id_user: user._id });
        } else if (user.role === 'admin_stan') {
            profileData = await Stan.findOne({ id_user: user._id });
        }

        const token = jwt.sign(
            { 
                id: user._id,
                role: user.role,
                profileId: profileData?._id 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    profile: profileData
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}; 