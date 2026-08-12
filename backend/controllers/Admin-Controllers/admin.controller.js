const bcrypt = require('bcrypt');
const cookieparser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {generateAccessAndRefreshToken , logoutSession} = require('../../services/auth.service.js');

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
            return logoutSession(res, null, 200, "Already logged out");
        }

        const verifyJWT = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        //case 1 : token sahi hai
        return await logoutSession(res, verifyJWT?.id, 200, "User logged out successfully");

    } catch (error) {
        //case 2 : expire tha
        if(error.name === 'TokenExpiredError'){
            const refreshToken = req.cookies?.refreshToken;
            const decode = jwt.decode(refreshToken);
            console.log("Logout due to fraudulant token");
            return logoutSession(res, decode?.id, 200, "Logout with expired refresh token");
        }else
            //case 3 : fraudulant tha
            if(error.name === 'JsonWebTokenError'){
                console.log("Logout due to fraudulant token");
                return logoutSession(res, null, 401, "Logout due to fraudulant token");
            }
        else{
            res.status(error.statusCode || 500).json({message: error.message});
            console.log(error?.message || "Logout password error");
        }
    }
}

//Change password //Authenticated Route
const changePassword = async (req,res) => {
    try {
        const {currentPassword, nextPassword, confirmPassword} = req.body;

        //neccessary checks are taken on frontend pass > 6, new !== confirm etc

        const db = GetDb();

        const [rows] = await db.promise().query(
            'SELECT password_hash FROM admin WHERE id = ?',
            [req.user?.id]
        );

        if(rows.length === 0){ throw new ApiError(401, "Password not found")}

        const password_hash = rows[0].password_hash;

        const comparePassword = await bcrypt.compare(currentPassword, password_hash);

        if(!comparePassword){
            throw new ApiError(401, "Invalid Current Passward");
        }

        //Extra check
        if(currentPassword === nextPassword){
            throw new ApiError(401, "New Password is same as old Passowrd");
        }

        const nextPassword_hash = await bcrypt.hash(nextPassword, 10);

        await db.promise().query(
            'UPDATE admin SET password_hash = ? WHERE id = ?',
            [nextPassword_hash, req.user?.id]
        );

        return res.status(200)
        .json({
            message: "Password Changed Successfully"
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({message: error.message});
        console.log(error?.message || "Changing Password Api Call Error");
    }
}

//RefreshToken generator new one
const rotateAccessToken = async (req, res) => {
    try {
            const incomingRefreshToken = req.cookies.refreshToken;
        
            if(!incomingRefreshToken){
                throw new ApiError(401, "Unathorized Request - No Refresh token in the cookies");
            }
         
            const verifyJWT = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
            
            const db = GetDb();

            //case 1 : token bilkul theek hai
            const [row] = await db.promise().query(
                `Select id, username, RefreshToken from admin WHERE id = ?`,
                [verifyJWT?.id]
            ); 
            
            if(row.length === 0){
                // throw new ApiError(401, "Either decode token is empty - user from db is empty");
                console.log("No user found in the db");
                return logoutSession(res, null, 401, "Account not found");
            }    

            const user = row[0];
        
            if(user.RefreshToken !== incomingRefreshToken){
                // throw new ApiError(401, "Invalid or wrong token - cookies vs Db - used or expired");
                console.log("Db RefreshToken not matched with cookie");
                return logoutSession(res, verifyJWT.id, 401, "Session mismatch — please log in again");
            }
        
            const {username, id} = user;
            const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken({username, id});
        
            const options = {
                httpOnly: true,
                secure: true,
                sameSite: 'none',  
            };
        
            //response back to frontend
            res.status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json({
                message : "Access and Refresh Token updated successfully"
            });

    } catch (error) {
        //case 2 : expire tha
        if(error.name === 'TokenExpiredError'){
            const refreshToken = req.cookies?.refreshToken;
            const decode = jwt.decode(refreshToken);
            return logoutSession(res, decode?.id, 401);
        }else
            //case 3 : fraudulant tha
            if(error.name === 'JsonWebTokenError'){
                return logoutSession(res, null, 401);
            }
        else{
            res.status(error.statusCode || 500).json({message: error.message});
            console.log(error?.message || "ChangeRefresh Token Error");
        }
    }
}



module.exports = {
    checkLogin,
    logoutUser,
    rotateAccessToken,
    changePassword
}