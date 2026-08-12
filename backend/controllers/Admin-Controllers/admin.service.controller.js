// const bcrypt = require('bcrypt');
// const cookieparser = require('cookie-parser');
// const jwt = require('jsonwebtoken');
const {ApiError} = require('../../utils/ApiError.utils.js');
const {GetDb} = require('../../database/connect.db.js');
const {findAllServices} = require('../../services/getService.js');
// const {generateAccessAndRefreshToken , logoutSession} = require('../services/auth.service.js');

//Post-Service
const postService = async (req,res) => {
    try {
        const {name, price, duration} = req.body;

        const db = GetDb();

        await db.promise().query(
            'INSERT INTO services (name,price,duration) VALUES (?,?,?);',
            [name, price, duration]
        );

        return res.status(200)
        .json({
            message: "Service added successfully"
        });

    } catch (error) {
        console.log(error?.message || "Error while adding service");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

//Get-Service
const getService = async (req,res) => {
    try {
       const rows = await findAllServices();
       return res.status(200).json(rows.length === 0 ? [] : rows);

    } catch (error) {
        console.log(error?.message || "Error while getting services for admin");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

//Delete servies
const deleteService = async (req, res) => {
    const id = req.params.id;

    try {
        const db = GetDb();

        await db.promise().query(
            `DELETE FROM services WHERE id = ?`,
            [id]
        );

        return res.status(200)
        .json({
            message: "Selected service deleted successfully"
        });

    } catch (error) {
        console.log(error?.message || "Error while deleting services");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

//Edit service
const editService = async (req, res) => {
    const {name, price, duration} = req.body;

    const id = req.params.id

    try {
        const db = GetDb();

        const [rows] = await db.promise().query(
            `SELECT * FROM services WHERE id = ?`,
            [id]  
        );

        if(rows.length === 0) return res.status(404).json({message: "Service not found"});

        await db.promise().query(
            `UPDATE services SET
                name = ?,
                price = ?,
                duration = ?
            WHERE id = ?`,
            [name, price, duration, id] 
        );

        return res.status(200)
        .json({message: "Service updates successfully"});
    } catch (error) {
        console.log(error?.message || "Error while deleting services");
        res.status(error.statusCode || 500).json({message: error.message});
    }
}

module.exports = {
    postService,
    getService,
    deleteService,
    editService
}
