const express = require('express');
const ApiController = require('../controllers/ApiController');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

// Firestore
router.route('/get-collection').get(ApiController.getCollection);
router.route('/get-object').get(ApiController.getObjectById);
router.route('/create-object').post(ApiController.createObject);
router.route('/update-object').put(ApiController.updateObject);
router.route('/delete-object').delete(ApiController.deleteObject);
// Storage
router.route('/upload-file').post(upload.single('file'), ApiController.uploadFile);
router.route('/delete-file').post(ApiController.deleteFile);
// Authentication
router.route('/sign-in').post(ApiController.signIn);
router.route('/sign-up').post(ApiController.signUp);
router.route('/sign-out').post(ApiController.signOut);
router.route('/reset-password').post(ApiController.resetPassword);
router.route('/update-user').post(ApiController.updateUser);
// Mails


module.exports = router;