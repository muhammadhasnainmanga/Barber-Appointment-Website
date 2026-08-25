const express = require('express');
const bookingRouter = express.Router();
const {getAllBookings, updateBookingsStatus} = require('../../controllers/Admin-Controllers/admin.bookings.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');

bookingRouter.route('/get-all-bookings').get(verifyJWT, getAllBookings);

bookingRouter.route('/update-booking-status/:id').patch(verifyJWT, updateBookingsStatus);

module.exports = bookingRouter;