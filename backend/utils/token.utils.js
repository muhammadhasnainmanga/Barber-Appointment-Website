const jwt = require('jsonwebtoken');

function generateAccessToken(username, id){
    return jwt.sign(
        {
            id,
            username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

function generateRefreshToken(username, id){
    return jwt.sign(
        {
            id,
            username
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}


module.exports = {
    generateAccessToken,
    generateRefreshToken
}