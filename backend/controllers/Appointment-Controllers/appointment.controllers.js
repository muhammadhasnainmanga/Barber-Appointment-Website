const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {getAvailableTimesForDate} = require('../../services/avail.service.js');

//Getting service is done from other files cuz of doubling

const getBlockDatesAndDays = async (req,res) => {
    try {
        const {type} = req.params;

        const db = GetDb();

        const[schedule] = await db.promise().query(
            `SELECT * FROM default_schedules WHERE type = ?`,
            [type]
        );

        const [dayBlock] = await db.promise().query(
            `SELECT * FROM block_slots WHERE type = ?`,
            [type]
        );

        const [dateOverride] = await db.promise().query(
            `SELECT * FROM override_schedules WHERE type = ?`,
            [type]
        );

        return res.status(200)
        .json({
            message: "Avaliablility dates fetched successfully",
            schedule,
            dayBlock,
            dateOverride
        });
    } catch (error) {
        console.log(error?.message || "Error while getting Block Dates And Days");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

const getTimeforSelectedDate = async (req, res) => {
    try {
        const {currentType, selectedDate} = req.params;
        const times = await getAvailableTimesForDate(currentType, selectedDate);
        return res.status(200)
        .json({
            message: "Time for selected date caught successfully",
            times: times
        });
    } catch (error) {
        console.log(error?.message || "Error while getting time for selected date");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

module.exports = {
    getBlockDatesAndDays,
    getTimeforSelectedDate
}