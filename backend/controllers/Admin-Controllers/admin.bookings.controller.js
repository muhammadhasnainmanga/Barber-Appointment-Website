const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'];

const getAllBookings = async (req, res) => {
    try {
        const db = GetDb();

        const [results] = await db.promise().query(
            `SELECT * FROM bookings ORDER BY date DESC`
        )
        return res.status(200)
        .json({
            result: results
        });
    } catch (error) {
        console.log(error?.message || "Error while getting Bookings");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

const updateBookingsStatus = async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        if (!VALID_STATUSES.includes(status)) {
            throw new ApiError(400, 'Invalid status value');
        }

        const db = GetDb();

        const [result] = await db.promise().query(
            `UPDATE bookings SET status = ? WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            throw new ApiError(404, 'Booking not found');
        }

        return res.status(200)
        .json({
            message: "Update successfully"
        });
    } catch (error) {
        console.log(error?.message || "Error while updating Bookings");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}
module.exports = {
    getAllBookings,
    updateBookingsStatus
}