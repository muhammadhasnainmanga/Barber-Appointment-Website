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


//User side service routes
const serviceUserRouter = require('./routes/User-Routes/user.routes.js');
app.use('/api/v1/user', serviceUserRouter);

//Admin Routes//

//Admin side auth Routes
const AuthadminRouter = require('./routes/Admin-Routes/admin.routes.js');
app.use('/api/v1/admin', AuthadminRouter);

//Admin side Service Routes
const serviceAdminRouter = require('./routes/Admin-Routes/admin.service.routes.js');
app.use('/api/v1/services', serviceAdminRouter);

//Admin side default schedule routes
const scheduleAdminRouter = require('./routes/Admin-Routes/admin.schedules.routes.js');
app.use('/api/v1/schedule', scheduleAdminRouter);


//Apointment
const appointmentRoutes = require('./routes/Appointment-Routes/appointment.routes.js');
app.use('/api/v1/appointment', appointmentRoutes);


module.exports = app;