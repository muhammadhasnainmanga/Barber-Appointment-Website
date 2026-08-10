const express = require('express');
const AdminRouter = express.Router();
const {checkLogin, logoutUser, rotateAccessToken, changePassword} = require('../controllers/admin.controller.js');
const {verifyJWT} = require('../middleware/auth.middleware.js');

AdminRouter.route('/login').post(checkLogin);

AdminRouter.route('/logout').post(logoutUser);

AdminRouter.route('/refresh-token').post(rotateAccessToken);

//Protected route
AdminRouter.route('/change-password').post(verifyJWT , changePassword);



module.exports = AdminRouter;