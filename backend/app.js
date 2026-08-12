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


//Admin Routes
const AdminRouter = require('./routes/Admin-Routes/admin.routes.js');
app.use('/api/v1/admin', AdminRouter);


//Service Routes
const serviceRouter = require('./routes/Admin-Routes/admin.service.routes.js');
app.use('/api/v1/services', serviceRouter);


const homeServiceRouter = require('./routes/User-Routes/user.routes.js');
app.use('/api/v1/user', homeServiceRouter);

module.exports = app;