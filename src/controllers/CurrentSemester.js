const CurrentSemester = require('../models/CurrentSemester');
const mongoose = require('mongoose');

module.exports = {
    postCurrentSemester: async (req, res) =>{
        const {schoolYear,semester,reg_by} = req.body
       try {
        await CurrentSemester.create({
            schoolYear,semester,reg_by
        })
        return res.status(201).json({
            message: "Sucessfully add current semester",
            })
       } catch (error) {
            return res.status(501).json({
                    message: "server error",
                    })
       }
    },
    updateCurrentSemester: async (req, res) =>{
       try {
        const { _id } = req.params
        const{ semester, reg_by, schoolYear} = req.body
        // console.log("current semester:",req.body)

        await CurrentSemester.updateOne(
                {_id: mongoose.Types.ObjectId(_id)}, 
                { semester, reg_by, schoolYear}
            )
        
        const findCurrentSemester = await CurrentSemester.findOne()
        console.log("find current semester:",findCurrentSemester)
        
        return res.status(201).json({
            message: "Succesfully update current semester",
            data: findCurrentSemester
            })
       } catch (error) {
        return res.message({message:error})
       }
    },
    getCurrentSemester: async(req, res) =>{
        try {
            const findCurrentSemester = await CurrentSemester.findOne()
            return res.status(201).json({
                message: "Succesfully get current semester",
                data: findCurrentSemester
                })
        } catch (error) {
            return res.message({message:error})
        }
    }
}