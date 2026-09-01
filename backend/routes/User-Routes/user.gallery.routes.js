const express = require('express');
const galleryUserRouter = express.Router();
const {getImages} = require('../../controllers/User-Controllers/user.gallery.controller');


galleryUserRouter.route('/get-all').get(getImages);


module.exports = galleryUserRouter;