const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const userAttendanceSchema = new mongoose.Schema({
    userId:{
        type: ObjectId, // untuk menangkap relasi dari model item
        ref: 'User'
    },
    attendanceId:{
        type: ObjectId, // untuk menangkap relasi dari model item
        ref: 'Attendance'
    },
    presence:{
        type: String,
        require: true
    },
    reg_by:{
        type: String,
    },
    updated_time:{
        type: Date,
        // require: true
    },
    created_time:{
        type: Date,
        // require: true
    },
    latitude: {
        type: Number,
        // required:true
    },
    longitude: {
        type: Number,
        // required:true
    },

})

module.exports = mongoose.model('UserAttendance', userAttendanceSchema)


