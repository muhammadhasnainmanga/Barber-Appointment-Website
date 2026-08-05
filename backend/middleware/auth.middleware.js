const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError.utils.js');
const {GetDb} = require('../database/connect.db.js');

const verifyJWT = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
    
        if(!accessToken){
            throw new ApiError(401, "No access token found in the cookies - Invalid request");
        }
    
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
        req.user = decoded;

        next();
    } catch (error) {
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                expired : true,
                message : "Access Token expired"
            })
        }else
            if(error.name  === 'JsonWebTokenError'){
                return res.status(401).json({
                expired : false,
                message : "Invlaid token"
            })
        }else{
            console.log(error?.message || "Auth Middleware Access Token issue");
            return res.status(401).json({
                expired: false,
                message: error?.message || "Authentication failed"
            });
        }
    }
}

module.exports = {
    verifyJWT
}