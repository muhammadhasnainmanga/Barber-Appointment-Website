const {GetDb} = require('../database/connect.db.js');

async function findAllServices() {
  const db = GetDb();
  const [rows] = await db.promise().query('SELECT * FROM services');
  return rows;
}

async function getAllImages() {
  const db = GetDb();
  const [rows] = await db.promise().query('SELECT * FROM gallery ORDER BY RAND()');
  return rows;
}

module.exports = {
    findAllServices,
    getAllImages
}