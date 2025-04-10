const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware,controller.getProducts);
router.get('/:id', authMiddleware,controller.getProductById);
router.post('/', controller.addProduct);
router.put('/:id', controller.updateProduct);

module.exports = router; 