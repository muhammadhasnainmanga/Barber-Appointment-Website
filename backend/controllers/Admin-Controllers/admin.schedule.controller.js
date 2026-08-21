const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');

const postDefaultSchedules = async (req, res) => {
    try {
        const {type , days} = req.body;

        const values = days.map((d) => [
            type,
            d.day,
            d.isOpen,
            d.start,     
            d.end,
            d.duration
        ]);

        const db = GetDb();

        await db.promise().query(
            `INSERT INTO default_schedules
            (type, day, is_open, start_time, end_time, slot_duration_minutes)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                is_open = VALUES(is_open),
                start_time = VALUES(start_time),
                end_time = VALUES(end_time),
                slot_duration_minutes = VALUES(slot_duration_minutes)`,
            [values]
        );

         return res.status(200).json({ message: 'Default schedule saved successfully'});
    } catch (error) {
        console.log(error.message || "Error while saving default schedules");
        res.status(500).json({message : error.message || "Sever Error - saving default schedule"});
    }
}

const getDefaultSchedules = async (req, res) => {
    try {
        const db = GetDb();

        const [results] = await db.promise().query(
            `SELECT * FROM default_schedules`
        );
        return res.status(200)
        .json({
                message: "Blocked scheduled fetched successfully", 
                results: results
        });
    } catch (error) {
        console.log(error.message || "Error while getting default schedules");
        res.status(500).json({message : error.message || "Sever Error - getting default schedule"});
    }
}

const postBlockSchedules = async (req, res) => {
    try {
        const {type, day, timesToBlock} = req.body;

        const db = GetDb();
        console.log(timesToBlock);
        if(timesToBlock[0] === 'whole_day'){
            const res = await db.promise().query(
                `DELETE FROM block_slots WHERE type = ? AND day = ? AND time != 'whole_day'`,
                [type, day]
            );
            console.log(res);
            await db.promise().query(
                `INSERT IGNORE INTO block_slots (type, day, time) VALUES (?, ?, 'whole_day')`,
                [type, day]
            );
        }else{
            const values = timesToBlock.map((t) => [type, day, t]);
            await db.promise().query(
                `INSERT IGNORE INTO block_slots (type, day, time) VALUES ?`,
                [values]
            );
        }
        return res.status(200).json({message: "Block Schedule saved successfully"});
    } catch (error) {
        console.log(error.message || "Error while saving block schedules");
        res.status(500).json({message : error.message || "Sever Error - saving block schedule"});
    }
}

const removeBlockSchedules = async (req, res) => {
    try {
        const {type, day, time} = req.body;

        const db = GetDb();

        const [results] = await db.promise().query(
            `DELETE FROM block_slots WHERE type = ? AND day = ? AND time = ?`,
            [type, day, time]
        );

        return res.status(200).json({message: "Block Schedule deleted successfully"});
    } catch (error) {
        console.log(error.message || "Error while deleting block schedules");
        res.status(500).json({message : error.message || "Sever Error - deleting block schedule"});
    }
}

const getBlockSchedules = async (req, res) => {
    try {
        const db = GetDb();

        const [results] = await db.promise().query(
            `SELECT * FROM block_slots`
        );

        return res.status(200)
        .json({
                message: "Blocked scheduled fetched successfully", 
                results: results
        });
    } catch (error) {
        console.log(error.message || "Error while getting block schedules");
        res.status(500).json({message : error.message || "Sever Error - getting block schedule"});
    }
}


module.exports = {
    postDefaultSchedules,
    postBlockSchedules,
    removeBlockSchedules,
    getBlockSchedules,
    getDefaultSchedules
}