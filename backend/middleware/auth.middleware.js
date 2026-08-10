const jwt = require('jsonwebtoken');
const {ApiError} = require('../utils/ApiError.utils.js');
const {GetDb} = require('../database/connect.db.js');

const verifyJWT = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
    
        if(!accessToken){
           return res.status(401).json({
                code: "ACCESS_TOKEN_MISSING",
                message: "Access token missing"
            });        
        }
    
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
        req.user = decoded;

        next();
    } catch (error) {
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                code : "ACCESS_TOKEN_EXPIRED",
                message : "Access Token expired"
            })
        }else
            if(error.name  === 'JsonWebTokenError'){
                console.log("Loure lag gaye");
                return res.status(401).json({
                code : "ACCESS_TOKEN_INVALID",
                message : "Invlaid token"
            })
        }else{
            console.log(error?.message || "Auth Middleware Access Token issue");
            return res.status(401).json({
                code : "AUTH_FAILED",
                message: error?.message || "Authentication failed"
            });
        }
    }
}

module.exports = {
    verifyJWT
}