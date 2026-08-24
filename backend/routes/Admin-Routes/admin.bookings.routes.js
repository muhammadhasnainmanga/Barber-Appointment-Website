const express = require('express');
const bookingAdminRouter = express.Router();
const {getAllBookings} = require('../../controllers/Admin-Controllers/admin.bookings.controller.js');
const {verifyJWT} = require('../../middleware/auth.middleware.js');

bookingAdminRouter.route('/get-all-bookings').get(verifyJWT, getAllBookings);

bookingAdminRouter.route('/update-booking-status/:id').patch(verifyJWT, updateBookingsStatus);

module.exports = bookingAdminRouter;