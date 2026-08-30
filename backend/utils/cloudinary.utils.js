const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { ApiError } = require('./ApiError.utils');

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET // Click 'View API Keys' above to copy your API secret
});

const cloudinaryUploader = async (localfilePath) => {
    try {
        if(!localfilePath){
            console.log("Local file path not found");
            throw new ApiError(409, "Please try again. File not detected");
        }
        const response = await cloudinary.uploader.upload(localfilePath, { resource_type: "auto" })
        return response;
    } catch (error) {
        fs.unlinkSync(localfilePath);
        return null;
    }
}

module.exports = cloudinaryUploader;