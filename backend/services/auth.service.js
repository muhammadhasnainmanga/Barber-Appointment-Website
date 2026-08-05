const {generateAccessToken, generateRefreshToken} = require('../utils/token.utils.js');
const {GetDb} = require('../database/connect.db.js');
const ApiError = require('../utils/ApiError.utils.js');


const generateAccessAndRefreshToken = async (payload) => {
    try {
        const {username , id} = payload;
    
        //Generating tokens
        const accessToken = generateAccessToken(username,id);
        const refreshToken = generateRefreshToken(username,id);
    
        //Putting refresh token into Database
        const db = GetDb();
    
        await db.promise().query(
            `UPDATE admin SET RefreshToken = ? WHERE id = ?`,
            [refreshToken, id]
        );
    
        return {refreshToken, accessToken};

    } catch (error) {
        throw new ApiError(500, "Error while generating Access and Refresh Token - auth services");
    }
}

const logoutSession = async (res, userId = null,  statusCode = 401, message = "Session expired") => {
    if (userId) {
        const db = GetDb();
        await db.promise().query(
            "UPDATE admin SET RefreshToken = NULL WHERE id = ?",
            [userId]
        );
    }

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    };

    return res
        .status(statusCode)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message });
};



module.exports = {
    generateAccessAndRefreshToken,
    logoutSession
};