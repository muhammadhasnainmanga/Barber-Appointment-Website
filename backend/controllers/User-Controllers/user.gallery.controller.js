const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {getAllImages} = require('../../services/getService.js');

const getImages = async (req,res) => {
    try {
       const rows = await getAllImages();
       return res.status(200).json(rows.length === 0 ? [] : rows);
    } catch (error) {
      console.log(error?.message || "Error while getting images for admin/user");
      res.status(error.statusCode || 500).json({message: error.message});
    }
}

module.exports = {
    getImages
}