const express = require('express');
const { check, body, header, cookies } = require('express-validator/check')
const User = require('../models/user')
const authController = require('../controllers/auth');


const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
	[
		body('email', 'Invalid email format!')
			.trim()
			.normalizeEmail()
			.isEmail(),
		body('password', 'Invalid password format!')
			.trim()
			.isLength({ min: 4 })
			.isAlphanumeric()
	], authController.postLogin);

//here the 'email' is the "name" of the input field in the signup form
router.post('/signup',
	[
		check('email')
			.trim()
			.normalizeEmail()
			.isEmail()
			.custom((value, { req }) => {
				// if (value === "test@test.com")
				// 	throw new Error('This email address is forbidden!');
				// return true;
				return User.findOne({ email: value })
					.then(user => {
						if (user) {
							return Promise.reject('Email already exists!')
						}
					})
			}),
		body('password', 'The password should be minimun 5 characters long and should consist of only alphanumerics characters!')
			.trim()
			.isLength({ min: 4 })
			.isAlphanumeric(),
		body('confirmPassword')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Passwords do not match!');
				}
				return true;
			})
	], authController.postSignup);
// router.post('/signup', check().isEmail().withMessage('Please enter a valid Email address!'), authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/update/:token', authController.getUpdate);
router.post('/update', authController.postUpdate);

module.exports = router;