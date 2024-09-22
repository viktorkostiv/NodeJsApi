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
// Mails


module.exports = router;