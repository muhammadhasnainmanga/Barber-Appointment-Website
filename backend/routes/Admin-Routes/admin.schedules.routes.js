const express = require('express');
const scheduleAdminRouter = express.Router();
const {postDefaultSchedules, postBlockSchedules, removeBlockSchedules, getBlockSchedules} = require('../../controllers/Admin-Controllers/admin.schedule.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');


//Protected routes
scheduleAdminRouter.route('/post-schedule').post(verifyJWT, postDefaultSchedules);

scheduleAdminRouter.route('/block-slots').post(verifyJWT, postBlockSchedules);

scheduleAdminRouter.route('/remove-block-slots').delete(verifyJWT, removeBlockSchedules);

scheduleAdminRouter.route('/get-block-slots').get(verifyJWT, getBlockSchedules);

module.exports = scheduleAdminRouter;