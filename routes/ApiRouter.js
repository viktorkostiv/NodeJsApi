const express = require('express');
const ApiController = require('../controllers/ApiController');
const router = express.Router();

// Firestore
router.route('/').get(ApiController.getCollection);
router.route('/get-object').get(ApiController.getObjectById);
router.route('/create').post(ApiController.createObject);
router.route('/update').put(ApiController.updateObject);
router.route('/delete').delete(ApiController.deleteObject);
// Storage

// Authentication
router.route('/sign-in').post(ApiController.signIn);
router.route('/sign-up').post(ApiController.signUp);
router.route('/sign-out').post(ApiController.signOut);
router.route('/reset-password').post(ApiController.resetPassword);
router.route('/update-user').post(ApiController.updateUser);
// Mails


module.exports = router;