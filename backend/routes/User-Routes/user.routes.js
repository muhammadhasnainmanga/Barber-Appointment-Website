const express = require('express');
const homeServiceRouter = express.Router();
const {loadService} = require('../../controllers/User-Controllers/user.service.controller.js');

homeServiceRouter.route('/get-services').get(loadService);


module.exports = homeServiceRouter;