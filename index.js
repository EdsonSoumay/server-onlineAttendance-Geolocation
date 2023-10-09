///// batas 
const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const dotenv = require('dotenv').config();
const methodOverride = require('method-override') // untuk menghandle put
// const connectDB = require('./config/db');

var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const PORT = process.env.PORT;

const app = express();
//router admin
const adminRouter = require('./src/routes/admin')
var apiRouter = require('./src/routes/api')


app.use(bodyParser.json()) // type json yang nantinya akan diterima

// untuk handle siapa sja yang dapat mengakses API kita
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin','*') // Origin = url yang ingin di berikan akses API 
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE, OPTIONS') // method = method dalam penggunaan API 
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization') // Content-Type = contohnya json, (xml, html?) dll. // Authorization = berguna ketika proses pengiriman token kedalam API
    next(); // agar requestnya tidak berhenti sampai disitu
})

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/db-onlineattendance')

// mongoose.connect(DB_URI)
// connectDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge : 600000000}
}))
app.use(flash())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/sb-admin-2', express.static(path.join(__dirname, 'node_modules/startbootstrap-sb-admin-2'))); // untuk mengarahkan ke path direktori sb-admin-2

app.get("/", (req, res) => res.send("Welcome to the API!"));

//admin
app.use('/admin', adminRouter)
//api
// app.use('/api/v1/member', apiRouter)
app.use('/user/api/v1', apiRouter); 

app.use((error, req, res, next)=>{
    const status = error.errorStatus || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data})
})

app.listen(PORT, ()=>console.log(`Conection Success from PORT ${PORT}`));





