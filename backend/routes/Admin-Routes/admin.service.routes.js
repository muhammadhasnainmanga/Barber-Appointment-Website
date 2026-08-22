const express = require('express');
const serviceAdminRouter = express.Router();
const {postService, getService, deleteService, editService} = require('../../controllers/Admin-Controllers/admin.service.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');


//Protected routes
serviceAdminRouter.route('/post-services').post(verifyJWT, postService);

//using for appointmend and admin side both
serviceAdminRouter.route('/get-services').get(verifyJWT, getService);

serviceAdminRouter.route('/delete-services/:id').delete(verifyJWT, deleteService);

serviceAdminRouter.route('/edit-services/:id').patch(verifyJWT, editService);

module.exports = serviceAdminRouter;