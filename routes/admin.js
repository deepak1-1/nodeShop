const { body } = require('express-validator/check')
const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
	body('title', 'Title length should be between 3-20!')
		.trim()
		.isLength({ min: 3, max: 20 })
		.isString(),
	body('price', 'Invalid Price!')
		.trim()
		.isFloat(),
	body('description', 'Description length should be between 10-200!')
		.trim()
		.isLength({ min: 10, max: 200, })
		.isString()
], adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', [
	body('title', 'Title length should be between 3-20!')
		.trim()
		.isLength({ min: 3, max: 20 })
		.isString(),
	body('price', 'Invalid Price!')
		.trim()
		.isFloat(),
	body('description', 'Description length should be between 10-200!')
		.trim()
		.isLength({ min: 10, max: 200, })
		.isString()
], adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

router.delete('/product/:productID',adminController.deleteProduct)
module.exports = router;
