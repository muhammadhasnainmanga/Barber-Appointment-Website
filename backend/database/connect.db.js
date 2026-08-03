require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

let db;

async function ConnectDb() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        })

        console.log("Mysql connected successfully");
        console.log(`Mysql Running on Port ${process.env.DB_PORT}`);

        // console.log(db);
        return db;
    } catch (error) {
        console.log(error, "Database connection failed");
        process.exit(1);
    } 
}

function GetDb(){
    return db;
}

// ConnectDb();

module.exports = {ConnectDb, GetDb};