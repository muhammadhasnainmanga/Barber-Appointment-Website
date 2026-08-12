const {GetDb} = require('../database/connect.db.js');

async function findAllServices() {
  const db = GetDb();
  const [rows] = await db.promise().query('SELECT * FROM services');
  return rows;
}

module.exports = {
    findAllServices
}