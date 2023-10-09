const Attendance = require('../models/Attendance');

module.exports = {
    postAbsence: async (req, res) =>{
        try {
            const {latitude, longitude, radius, lateTolerance,  regBy,  description,  schoolYear, semester} = req.body
            if(schoolYear === undefined || semester === undefined){
                return res.status(404).json({
                    message: "Please Register School Year and Semester",
                    })
            }
            await Attendance.create({
                regBy, description, status: true, schoolYear, semester,
                latitude, longitude, radius, lateTolerance, isActive:true,
                date_created:  new Date(), 
                absenDate: new Date()
            })
            return res.status(201).json({
            message: "Create New Absence Success",
            })
          } catch (error){
            // console.log("error:",error)
            return res.status(500).json({message: "server error"})
          }
    },
    deactivateAbsence: async (req, res) =>{
        try {
            const { attendanceId } = req.params
            const { updatedBy } = req.body

            await Attendance.findOne({_id: attendanceId})
            .then((update)=>{
                update.isActive = false
                update.updatedBy = updatedBy
                return update.save()
            })
            .then(result =>{
                return res.status(201).json({
                    message: 'Deactivate Absence Success',
                })
            })
            .catch((error)=>{
                return res.status(500).json({message: "server error"})
            })
          } catch (error){
            return res.status(500).json({message: "server error"})
          }
    },
    softDeleteAbsence: async (req, res) =>{
        try {
            const { attendanceId } = req.params
            const { updatedBy } = req.body

            await Attendance.findOne({_id: attendanceId})
            .then((update)=>{
                console.log("update:",update)
                update.status = false
                update.isActive = false
                update.updatedBy = updatedBy
                return update.save()
            })
            .then(result =>{
                return res.status(201).json({
                    message: 'Delete Absence Success',
                })
            })
            .catch((error)=>{
                return res.status(500).json({message: "server error"})
            })
        } catch (error){
            return res.status(500).json({message: "server error"})
        }
    },
    deleteAbsence: async (req, res) =>{
        try {
            const { attendanceId } = req.params
            await Attendance.remove({_id:attendanceId})
            .then(
                result =>{
                    res.status(201).json({
                        message: 'Delete Absence Success',
                        })
                }
            )
            .catch( error =>{
                return res.status(500).json({message: "server error"})
            })
          } catch (error){
            return res.status(500).json({message: "server error"})
          }
    },
    getAbsences: async (req, res)=>{
        try {
            const getAbsences =  await Attendance.find({status:true})
           return res.status(201).json({
                message: "Sucessfuly get Absences",
                data:getAbsences
                })
        } catch (error) {
            return res.status(500).json({message: "server error"})
        }
    },
    getAbsencesBySemester: async (req, res)=>{
        try {
            const { schoolYear, semester} = req.query
            const getAbsencesBySemester = await Attendance.find({status:true, schoolYear, semester}).sort({'_id': -1})
            return res.status(201).json({
                message: "Sucessfuly get Absences",
                data: getAbsencesBySemester
            })
        } catch (error) {
            return res.status(500).json({message: "server error"})
        }
    }
}