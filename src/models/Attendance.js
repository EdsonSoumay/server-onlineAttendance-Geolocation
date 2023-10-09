const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const attendaceSchema = new mongoose.Schema({
    time_created:{
        type: String,
        // required: true //untuk melakukan validasi
    },
    date_created:{
        type: Date,
        // type: string,
        // required: true
    },
    schoolYear:{
        type: String,
        required: true 
    },
    regBy: {
        type: String,
        // required: true 
    },
    description:{
        type: String,
        // required: true 
    },
    status:{
        type: Boolean,
        required: true 
    },
    userAttendance: {
         // ini digunakan sebagai temp variable di controller
        type: Array,
        // required: true 
    },
    schoolYear:{
        type: String,
        required: true,
    },
    semester:{
        type: String,
        required: true,
    },
    absenDate:{
        type: Date
    },
    absenDateString:{
        // ini digunakan sebagai temp variable di controller
        type: String
    },
    absenTimeString:{
        // ini digunakan sebagai temp variable di controller
        type: String
    },
    // ini atribut model yang pake geolocation
    latitude: {
        type: Number,
        required:true
    },
    longitude: {
        type: Number,
        required:true
    },
    radius: {
        type: Number,
        required:true
    },
    lateTolerance:{
        type: Number,
        required:true
    },
    isActive:{
        type: Boolean,
        required:true
    },
    updatedBy:{
        type:String,
        // require:true
    },
})

module.exports = mongoose.model('Attendance', attendaceSchema)


