const express = require('express');
const scheduleAdminRouter = express.Router();
const {postDefaultSchedules, getDefaultSchedules, postBlockSchedules, removeBlockSchedules, getBlockSchedules, postOverridesSchedules} = require('../../controllers/Admin-Controllers/admin.schedule.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');


//Protected routes

//default schedules routes
scheduleAdminRouter.route('/post-schedule').post(verifyJWT, postDefaultSchedules);

scheduleAdminRouter.route('/get-schedule').get(verifyJWT, getDefaultSchedules);

//block slots routes
scheduleAdminRouter.route('/block-slots').post(verifyJWT, postBlockSchedules);

scheduleAdminRouter.route('/remove-block-slots').delete(verifyJWT, removeBlockSchedules);

scheduleAdminRouter.route('/get-block-slots').get(verifyJWT, getBlockSchedules);

//overrides schedule routes
scheduleAdminRouter.route('/post-date-overrides').post(verifyJWT, postOverridesSchedules);


module.exports = scheduleAdminRouter;