const bcrypt = require('bcrypt');
const cookieparser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError.utils.js');
const {GetDb} = require('../database/connect.db.js');
const {generateAccessAndRefreshToken} = require('../services/auth.service.js');

//Login
const checkLogin = async (req,res) => {
    try {
        const {Username , Password} = req.body;

        if(!Username || !Password){
            throw new ApiError(400, "Either Password or Username is empty");
        }

        const db = GetDb();

        const [rows] = await db.promise().query(
            `SELECT * FROM ADMIN WHERE USERNAME = ?`,
            [Username]
        );

        if(rows.length === 0){
            throw new ApiError(404, "User/Admin doesnot exist");
        }

        const user = rows[0];
        const passwrodMatch = await bcrypt.compare(Password, user.password_hash);

        if(!passwrodMatch){
            throw new ApiError(401, "Invalid Password !");
        }

        //Access and Refresh tokens can be generated here and sent to the client for further authentication and authorization.
        const {username, id} = user;
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken({username, id});

        //Sending tokens to the user through cookies
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',   // 🔧 cross-origin (5500 → 4000) ke liye zaroori
        };

        //response back to frontend
        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            id: user.id,
            username: user.username,
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({message: error.message});
        console.log(error.message);
    }
}


//Logout
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
    
        if(!refreshToken){
            throw new ApiError(401, "User is not logged in - no Refresh token found !");
        }

        const db = GetDb();

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await db.promise().query(
            `UPDATE admin SET RefreshToken = NULL WHERE id = ?`,
            [decoded.id]
        );

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',   // 🔧 cross-origin (5500 → 4000) ke liye zaroori
        };

        //response back to frontend
        res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({
            message: "User logged out successfully"
        });


    } catch (error) {
        res.status(error.statusCode || 500).json({message: error.message});
        console.log(error.message);
    }
}



module.exports = {
    checkLogin,
    logoutUser
}