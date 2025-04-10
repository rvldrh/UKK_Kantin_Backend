const express = require('express');
const router = express.Router();
const stanController = require('../controllers/stanController');
const { protect, restrictTo } = require('../middleware/auth')

router.get('/', stanController.getAllStan);
router.post('/', protect, restrictTo('admin_stan'), stanController.createStan);
router.patch('/:id', protect, restrictTo('admin_stan'),stanController.updateStan);
router.delete('/:id', protect, restrictTo('admin_stan'),stanController.deleteStan);
router.get('/stan', protect, restrictTo('admin_stan'),stanController.getStanByIdUser);
module.exports = router; 