const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rotas Base da API de Produtos (Acessíveis pelo Frontend)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
