const cors = require('cors');
const express = require('express');
const cookieparser = require('cookie-parser');

const app = express();

app.use(cors({
    origin: 'http://localhost:5500', // 🔧 apni Live Server ki exact port confirm kar lena
    origin: 'http://127.0.0.1:5500', // 🔧 apni Live Server ki exact port confirm kar lena
    credentials: true,
}));

app.use(express.json());
app.use(cookieparser());


//Routes
const AdminRouter = require('./routes/admin.routes.js');

app.use('/api/v1/admin', AdminRouter);


module.exports = app;