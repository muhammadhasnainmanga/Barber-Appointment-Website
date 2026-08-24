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
            times: times.formattedTimes
        });
    } catch (error) {
        console.log(error?.message || "Error while getting time for selected date");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

const postBooking = async (req, res) => {
  try {
    const { type, name, phone, serviceId, date, day, time, address } = req.body;

    if (!type || !name || !phone || !serviceId || !date || !time) {
      throw new ApiError(400, 'Missing required fields');
    }
    if (type === 'home_service' && !address) {
      throw new ApiError(400, 'Address is required for home service bookings');
    }

    const db = GetDb();

    // Trust boundary — price/name kabhi client se nahi, hamesha DB se
    const [serviceRows] = await db.promise().query(
      'SELECT name, price FROM services WHERE id = ?',
      [serviceId]
    );
    if (serviceRows.length === 0) throw new ApiError(404, 'Service not found');
    const service = serviceRows[0];

    // Availability dobara verify — wahi function jo dates/times dikhane ke liye bana tha
    const availableTimes = await getAvailableTimesForDate(type, date);
    if (!availableTimes.times.includes(time)) {
      throw new ApiError(409, 'This slot is no longer available. Please pick another.');
    }

    try {
      await db.promise().query(
        `INSERT INTO bookings (type, name, phone, service_id, service_name, amount, date, day, time, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, name, phone, serviceId, service.name, service.price, date, day, time, address || null]
      );
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        throw new ApiError(409, 'This slot was just booked by someone else. Please pick another.');
      }
      throw dbError;
    }

    return res.status(201).json({ message: 'Booked successfully' });
  } catch (error) {
    console.log(error?.message || 'Error while adding booking');
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

//for frontend home side
const getBooking = async (req, res) => {
  try {
      const {phone} = req.params;
    
      const db = GetDb();
    
      const [rows] = await db.promise().query(
        `SELECT service_name, date, time, type, status FROM bookings WHERE phone = ? ORDER BY date DESC`,
        [phone]
      );
      return res.status(200).json({ bookings: rows });
    }
  catch (error) {
    console.log(error?.message || 'Error fetching bookings by phone');
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = {
    getBlockDatesAndDays,
    getTimeforSelectedDate,
    postBooking,
    getBooking
}