const { Stan } = require("../models/main.model");

exports.getAllStan = async (req, res) => {
    try {
        const stan = await Stan.find();
        res.status(200).json({
            status: "success",
            data: stan,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.createStan = async (req, res) => {
    try {
        const existingStan = await Stan.findOne({ nama_stan: req.body.nama_stan });
        if (existingStan) {
            return res.status(400).json({
                status: "error",
                message: `Stan dengan nama "${req.body.nama_stan}" sudah ada, mohon gunakan nama lain.`,
            });
        }

        const newStan = await Stan.create({
            nama_stan: req.body.nama_stan,
            nama_pemilik: req.body.nama_pemilik,
            telp: req.body.telp,
            id_user: req.body.id_user,
        });

        res.status(201).json({
            status: "success",
            data: newStan,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.updateStan = async (req, res) => {
    try {
        const existingStan = await Stan.findOne({
            nama_stan: req.body.nama_stan,
            _id: { $ne: req.params.id },
        });

        if (existingStan) {
            return res.status(400).json({
                status: "error",
                message: `Stan dengan nama "${req.body.nama_stan}" sudah ada, mohon gunakan nama lain.`,
            });
        }

        const stan = await Stan.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        res.status(200).json({
            status: "success",
            data: stan,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.deleteStan = async (req, res) => {
    try {
        await Stan.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.getStanByIdUser = async (req, res) => {
    try {
        const stan = await Stan.findOne({ id_user: req.user.id });
        res.status(200).json({
            status: "success",
            data: stan,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
