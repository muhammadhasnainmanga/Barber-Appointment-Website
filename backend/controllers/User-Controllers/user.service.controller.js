const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {findAllServices} = require('../../services/getService.js');

const loadService = async (req,res) => {
    try {
       const rows = await findAllServices();
       return res.status(200).json(rows.length === 0 ? [] : rows);

    } catch (error) {
        console.log(error?.message || "Error while getting services for home");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

module.exports = {
    loadService
}