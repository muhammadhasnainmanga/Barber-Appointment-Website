const express = require('express');
const serviceRouter = express.Router();
const {postService, getService, deleteService, editService} = require('../../controllers/Admin-Controllers/admin.service.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');


//Protected routes
serviceRouter.route('/post-services').post(verifyJWT, postService);

serviceRouter.route('/get-services').get(verifyJWT, getService);

serviceRouter.route('/delete-services/:id').delete(verifyJWT, deleteService);

serviceRouter.route('/edit-services/:id').patch(verifyJWT, editService);

module.exports = serviceRouter;