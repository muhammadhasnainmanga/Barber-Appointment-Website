const express = require('express');
const appointmentRouter = express.Router();
const {getBlockDatesAndDays, getTimeforSelectedDate, postBooking, getBooking, deleteBooking} = require('../../controllers/Appointment-Controllers/appointment.controllers.js');
const {getService} = require('../../controllers/Admin-Controllers/admin.service.controller.js');


appointmentRouter.route('/get-dates/:type').get(getBlockDatesAndDays);

appointmentRouter.route('/get-services').get(getService);

appointmentRouter.route('/get-time/:currentType/:selectedDate').get(getTimeforSelectedDate);

appointmentRouter.route('/post-booking').post(postBooking);

//for lookup fronted home side - general lookup.js ke andr hai code
appointmentRouter.route('/get-booking/:phone').get(getBooking);

//for lookup for deleteing
appointmentRouter.route('/delete-booking/:id').delete(deleteBooking);



module.exports = appointmentRouter;