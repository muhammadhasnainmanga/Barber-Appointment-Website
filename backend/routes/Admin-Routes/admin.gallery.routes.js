const express = require('express');
const galleryRouter = express.Router();
const {verifyJWT} = require('../../middleware/auth.middleware.js');
const upload = require('../../middleware/multer.middleware.js');
const {addGalleryItem, getAllGalleryItems, deleteGalleryItem, editLabel} = require('../../controllers/Admin-Controllers/admin.gallery.controller.js');

// 🔧 Order zaroori hai: pehle auth (kya login hai), phir upload (file parse karo), phir controller
galleryRouter.route('/add').post(verifyJWT, upload.single('image'), addGalleryItem);
galleryRouter.route('/get-all').get(verifyJWT, getAllGalleryItems);
galleryRouter.route('/delete/:id').delete(verifyJWT, deleteGalleryItem);
galleryRouter.route('/edit-label/:id').patch(verifyJWT, editLabel);


module.exports = galleryRouter;