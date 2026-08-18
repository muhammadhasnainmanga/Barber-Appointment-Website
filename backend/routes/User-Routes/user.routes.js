const express = require('express');
const serviceUserRouter = express.Router();
const {loadService} = require('../../controllers/User-Controllers/user.service.controller.js');


serviceUserRouter.route('/get-services').get(loadService);


module.exports = serviceUserRouter;