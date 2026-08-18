const express = require('express');
const AuthadminRouter = express.Router();
const {checkLogin, logoutUser, rotateAccessToken, changePassword} = require('../../controllers/Admin-Controllers/admin.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');

AuthadminRouter.route('/login').post(checkLogin);

AuthadminRouter.route('/logout').post(logoutUser);

AuthadminRouter.route('/refresh-token').post(rotateAccessToken);

//Protected route
AuthadminRouter.route('/change-password').post(verifyJWT , changePassword);



module.exports = AuthadminRouter;