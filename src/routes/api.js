const router = require('express').Router();
const UserController = require('../controllers/UserController');
const AttendanceController = require('../controllers/AttendanceController');
const CurrentSemester = require('../controllers/CurrentSemester');
const AbsencesController = require('../controllers/AbsencesController')

//CURRENT SEMESTER
        router.put('/currentsemester/:_id', CurrentSemester.updateCurrentSemester )
        router.post('/currentsemester', CurrentSemester.postCurrentSemester )
        router.get('/currentsemester/:_id', CurrentSemester.getCurrentSemester )

////USER & AUTH 
        router.post('/admin', UserController.addAdmin )
        router.post('/registration', UserController.registration )
        router.post('/login', UserController.login)
        router.put('/forgotpassword', UserController.forgotPassword)
        router.post('/sendemail', UserController.sendEmail) // send email to get token for forget password
        router.get('/users', UserController.users)
        router.put('/user/:userId/update', UserController.updateUser)

//ABSEN BY LOCATION
        router.post('/absence/', AbsencesController.postAbsence)
        router.put('/absence/deactive/:attendanceId', AbsencesController.deactivateAbsence)
        router.delete('/absence/:attendanceId', AbsencesController.softDeleteAbsence)// soft delete
        router.get('/allabsences/', AbsencesController.getAbsences)// get all absences
        router.get('/absences/', AbsencesController.getAbsencesBySemester)//get absences by semester

// USER ATTENDANCE
        router.post('/postusersattendance/:userId', AttendanceController.postUserAttendance) // kirim absen dari user
        router.put('/edituserattendance/:userId', AttendanceController.editUserAttendance) // update absen dari officer
        router.get('/getusersallsattendance/', AttendanceController.getUsersAllAttendance) // get semua user punya semua attendance/absen di semester tertentu. ini yg pake di mobile. pake query
        router.get('/getuserfilterattendance/', AttendanceController.getUserFilterAttendance) // get satu user punya semua attendance/absen. ini yang pake di mobile
        router.get('/getuserabsencebyattendance/:absenceId',AttendanceController.getUserAttendanceByAbsence)

module.exports = router;