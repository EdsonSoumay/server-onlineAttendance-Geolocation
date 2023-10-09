const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true //untuk melakukan validasi
      },
    lastName: {
        type: String,
        // required: true 
      },
    email: {
        type: String,
        required: true 
      },
    userName: {
        type: String,
        required: true 
      },
    password: {
        type: String,
        required: true 
      },
    role: {
        type: String,
        required: true 
      },
    isActive: {
        type: Boolean,
        required: true 
      },
    isAccepted: {
        type: Boolean,
        required: true 
      },

    division: {
        type: String,
        // required: true 
      },
    pictureUrl: {
        type: String,
        // required: true 
      }
    
})

module.exports = mongoose.model('User', userSchema)