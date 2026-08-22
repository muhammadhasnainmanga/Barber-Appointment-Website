const express = require('express');
const appointmentRouter = express.Router();
const {getBlockDatesAndDays, getTimeforSelectedDate} = require('../../controllers/Appointment-Controllers/appointment.controllers.js');
const {getService} = require('../../controllers/Admin-Controllers/admin.service.controller.js');


appointmentRouter.route('/get-dates/:type').get(getBlockDatesAndDays);

appointmentRouter.route('/get-services').get(getService);

appointmentRouter.route('/get-time/:currentType/:selectedDate').get(getTimeforSelectedDate);


module.exports = appointmentRouter;