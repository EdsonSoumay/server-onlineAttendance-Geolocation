const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const currentSemesterSchema = new mongoose.Schema({
    schoolYear:{
        type: String,
        required: true,
    },
    semester:{
        type: String,
        required: true,
    },
    reg_by:{
        type: String,
        required: true,
    },
})

module.exports = mongoose.model('CurrentSemester', currentSemesterSchema)


