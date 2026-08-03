const express = require('express');
const AdminRouter = express.Router();
const {checkLogin, logoutUser} = require('../controllers/admin.controller.js');


AdminRouter.route('/login').post(checkLogin);

AdminRouter.route('/logout').post(logoutUser);

module.exports = AdminRouter;