const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {getAllImages} = require('../../services/getService.js');
const cloudinaryUploader = require('../../utils/cloudinary.utils.js');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const addGalleryItem = async (req, res) => {
  try {
    //file present check
    if (!req.file) throw new ApiError(400, 'Image is required');
    const { caption } = req.body;   // 🔧 text-fields yahan aate hain, req.file mein nahi

    //upload on cluadinary
    const localFilePath = req.file.path;
    const uploadonCloudinary = await cloudinaryUploader(localFilePath);

    if(!uploadonCloudinary.url || !uploadonCloudinary.public_id) throw new ApiError(400, "Error while uploading file on cloudinary");

    //local se hatana
    fs.unlink(localFilePath, (err) => {
      if (err) console.log('Local file cleanup warning:', err.message);
    });

    //db me cluadinary ka link dalna
    const db = GetDb();
    await db.promise().query(
      'INSERT INTO gallery (image_url, label, public_id) VALUES (?, ?, ?)',
      [uploadonCloudinary.url, caption, uploadonCloudinary.public_id]   // filename alag rakho — delete ke waqt kaam aayega
    );

    return res.status(200).json({ message: 'Photo added successfully'});
  } catch (error) {
    console.log(error?.message || 'Error adding gallery item');
    res.status(error.statusCode || 500).json({ message: error.message});
  }
};

const getAllGalleryItems = async (req, res) => {
  try {
      const rows = await getAllImages();
      return res.status(200).json(rows.length === 0 ? [] : rows);

  } catch (error) {
      console.log(error?.message || "Error while getting images for admin/user");
      res.status(error.statusCode || 500).json({message: error.message});
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const db = GetDb();
    const [rows] = await db.promise().query('SELECT public_id FROM gallery WHERE id = ?', [id]);

    if (rows.length === 0) throw new ApiError(404, 'Photo not found');

    await cloudinary.uploader.destroy(rows[0].public_id);

    await db.promise().query('DELETE FROM gallery WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.log("Error while deleting file from claudinary and stuff")
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const editLabel = async (req, res) => {
    const {newLabel} = req.body;
    const id = req.params.id;
 try {
    if (!newLabel) {
      return res.status(400).json({ message: 'New label is required' });
    }

    const db = GetDb();
    const [rows] = await db.promise().query(
        `SELECT * FROM gallery WHERE id = ?`,
        [id]  
    );

    if(rows.length === 0) return res.status(404).json({message: "Service not found"});

    await db.promise().query(
        `UPDATE gallery SET label = ? WHERE id = ?`,
        [newLabel, id] 
    );

    return res.status(200)
    .json({message: "File/Testimonial label updates successfully"});
  } catch (error) {
    console.log("Error while updating file label - cloudinary")
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = {
    addGalleryItem, 
    getAllGalleryItems, 
    deleteGalleryItem,
    editLabel
}