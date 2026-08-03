const express = require('express');
const AdminRouter = express.Router();
const CheckLogin = require('../controllers/admin.controller.js');


AdminRouter.route('/login').post(CheckLogin);

module.exports = AdminRouter;