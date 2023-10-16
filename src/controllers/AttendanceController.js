const Attendance = require('../models/Attendance');
const UserAttendance = require('../models/UserAttendance');
const Member = require('../models/User');

function Distance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }
  
module.exports = {
    postUserAttendance: async (req, res, next) =>{
        try {
            const { latitude, longitude } = req.body;
            const userAbsenceTime = new Date()
            const { userId } = req.params

            //get current absension
            const getAttendance = await Attendance.findOne({isActive: true})
            if(getAttendance === null){
                return res.status(404).json({message: "absension is not found"})  
            }
            const distance = Distance(
                    latitude,//user
                    longitude,//user
                    getAttendance.latitude,//absence
                    getAttendance.longitude//absence
                )

             //check jika user sudah mengisi absen atau belum
             const userAttendance = await UserAttendance.findOne({
                attendanceId:getAttendance._id,
                userId:userId
             })
           
            if(userAttendance){
               return res.status(409).json({message: "u have filled this absension"})  
            }

            // if (distance < getAttendance.radius) {
            if (distance > getAttendance.radius) {
                return res.status(403).json({message: "You are outside area"})  
            }

            //bikin logic untuk menentukan user tersebut late atau tidak
            let presenceStatus;
            const convertGetAttendanceDate = new Date(getAttendance.date_created);
            convertGetAttendanceDate.setMinutes(convertGetAttendanceDate.getMinutes() + getAttendance.lateTolerance);
            
            if( convertGetAttendanceDate >= userAbsenceTime){ // new Date() = time ketika user send lokasi absen
                presenceStatus = 'ontime'
            }else{
                presenceStatus = 'late'
            } 

            await UserAttendance.create({
                userId: userId, 
                presence: presenceStatus, 
                attendanceId:getAttendance.id, 
                latitude,
                longitude,
                created_time: userAbsenceTime
            })
            return res.status(201).json({
                message: "Sucessfuly Send Absence",
                })
          } catch (error){
            // console.log("error:",error)
            return res.status(500).json({message: "server error"})  
          }
    },

    editUserAttendance: async (req, res, next) =>{
        try {
            const { presence, attendanceId, reg_by } = req.body
            const { userId } = req.params
            let today = new Date();
           
            //validasi value dari qrCode
            const getAttendance = await Attendance.findOne({_id:attendanceId})
            const userAttendance = await UserAttendance.findOne({attendanceId:getAttendance._id, userId:userId })

            //jika belum isi
            if(!userAttendance){
                await UserAttendance.create({
                   userId: userId, presence: presence, 
                   attendanceId:getAttendance.id, 
                   reg_by, updated_time : today
                })
                return res.status(201).json({
                    message: "Sucessfuly Edit User Attendance",
                })
            }

            //jika salah isi
            if(userAttendance){
            console.log("dia masuk disini")
            await UserAttendance.updateOne({userId:userId, attendanceId:getAttendance.id}, { reg_by , presence,  updated_time : today });
            return res.status(201).json({message: 'Sucessfuly Edit User Attendance'})
            }
          } catch (error){
               return res.message({message:error})
          }
    },

    getUsersAllAttendance: async (req, res, next)=>{
        try {
            const { schoolYear, semester } = req.query;
            let arrayGetAttendance = []
            let schoolYears = []
            let getSchoolYears = await Attendance.find({status: true})
            const defaultSchoolYear = '2021-2022'
            const defaultSemester = '1'
            
            //check tahun ajaran
            for(let i = 0; i < getSchoolYears.length; i++){
                if(!schoolYears.includes(getSchoolYears[i].schoolYear)){
                    schoolYears.push(getSchoolYears[i].schoolYear)
                }
            }

            // cari semua absen
            let  getAttendance = await Attendance.find({
                status: true, 
                schoolYear:schoolYear?schoolYear:defaultSchoolYear, 
                semester: semester?semester:defaultSemester
            }).sort({absenDate: 1})

            // cari absen user
            for(let i = 0; i < getAttendance.length; i++){
                let newGetAttendance = getAttendance[i]
                const getUserAttendance = await UserAttendance.find({attendanceId: getAttendance[i]._id})
                                         .populate({path: 'userId', select: 'lastName firstName userName'})
                let arrayUserGetAttendance = []

                for(let i = 0; i < getUserAttendance.length; i++){
                    arrayUserGetAttendance.push(getUserAttendance[i])
                }
  
                newGetAttendance.userAttendance = arrayUserGetAttendance;

                //set up date
                let day = getAttendance[i].absenDate.toLocaleDateString('en-US', {weekday: 'long'});
                let dateNumber = getAttendance[i].absenDate.toLocaleDateString('en-US', {day: '2-digit'});
                let month = getAttendance[i].absenDate.toLocaleDateString('en-US', {month: '2-digit'});
                let year = getAttendance[i].absenDate.toLocaleDateString('en-US', {year: 'numeric'});
                let formattedDate = day + ', ' + dateNumber + ' - ' + month + ' - ' + year;
                //end set up date

                //set up time
                let utc_hours = getAttendance[i].absenDate.getUTCHours();
                utc_hours += 8;
                getAttendance[i].absenDate.setUTCHours(utc_hours);
                let dateString = getAttendance[i].absenDate.toISOString();
                let timeString = dateString.slice(11, 23) + dateString.slice(26, 29);
                //end set up time
                newGetAttendance.absenDateString = formattedDate;
                newGetAttendance.absenTimeString = timeString;
                arrayGetAttendance.push(newGetAttendance)
            }

            // cocokan dengan nama member
            const getMember = await Member.find({isActive: true})
            let newArrayobject2 = []
            
            for(let i = 0; i < getMember.length; i++){
                let arrayObject = []
                
                for(let j = 0; j < arrayGetAttendance.length; j ++){
                   const filterArray = arrayGetAttendance[j].userAttendance.filter(e =>e.userId?.userName == getMember[i].userName);
                   if(filterArray){
                    if(filterArray.length!= 0){
                        arrayObject.push({
                            userId:getMember[i]._id,
                            userName:getMember[i].userName,
                            firstName:getMember[i].firstName,
                            lastName:getMember[i].lastName,
                            presence:filterArray[0].presence,
                            date: arrayGetAttendance[j].date_created
                        })
                    }
                    if(filterArray.length == 0){
                        arrayObject.push({
                            userId:getMember[i]._id,
                            userName:getMember[i].userName,
                            firstName:getMember[i].firstName,
                            lastName:getMember[i].lastName,
                            presence:'absen',
                            date: arrayGetAttendance[j].date_created
                        })
                    }
                   }
                }
                newArrayobject2.push(arrayObject)
            }
            // console.log("new array obj 2:",newArrayobject2);
               
             return res.status(201).json({
                  message: "Sucessfuly get User Attendance",
                  data:{
                   date: arrayGetAttendance, 
                  member: newArrayobject2,
                  schoolYear: schoolYear? schoolYear : defaultSchoolYear,
                  semester: semester? semester : defaultSemester,
                  filterSchoolYear: schoolYears
                  }
                })
          } catch (error) {
             return res.message({message:error})
          }
    },

    getUserFilterAttendance: async (req, res, next)=>{
        try {
            const { userId, semester, schoolYear } = req.query;
            let onTime = 0;
            let late = 0;
            let notPresent = 0;
            let excuse = 0;
            let arrayGetAttendance = []
            const getAttendance = await Attendance.find({
                status:true,
                semester: semester,
                schoolYear: schoolYear
            })
            //di looping agar bisa mendapatkan absen
            for(let i = 0; i < getAttendance.length; i++){
                let newGetAttendance = getAttendance[i]
                const getUserAttendance = await UserAttendance.find({
                    attendanceId: getAttendance[i]._id,
                    userId: userId
                })
                .populate({path: 'userId', select: 'lastName firstName'})
                let arrayUserGetAttendance = []
                for(let i = 0; i < getUserAttendance.length; i++){
                    arrayUserGetAttendance.push(getUserAttendance[i])
                }
                
                //kondisi for filter
                if(arrayUserGetAttendance.length  != 0){
                   if(arrayUserGetAttendance[0].presence.includes('late')){
                        late = 1 + late
                   }
                   else if(arrayUserGetAttendance[0].presence.includes('ontime')){
                        onTime = 1 + onTime
                   }
                   else if(arrayUserGetAttendance[0].presence.includes('excuse')){
                        excuse = 1 + excuse
                   }
                }
                else if(arrayUserGetAttendance.length  == 0){
                    notPresent = 1 + notPresent
                }

                // set up date and time
                  //set up date
                  let day = getAttendance[i].absenDate.toLocaleDateString('en-US', {weekday: 'long'});
                  let dateNumber = getAttendance[i].absenDate.toLocaleDateString('en-US', {day: '2-digit'});
                  let month = getAttendance[i].absenDate.toLocaleDateString('en-US', {month: '2-digit'});
                  let year = getAttendance[i].absenDate.toLocaleDateString('en-US', {year: 'numeric'});
                  let formattedDate = day + ', ' + dateNumber + ' - ' + month + ' - ' + year;
                  //end set up date
  
                  //set up time
                  let utc_hours = getAttendance[i].absenDate.getUTCHours();
                  utc_hours += 8;
                  getAttendance[i].absenDate.setUTCHours(utc_hours);
                  let dateString = getAttendance[i].absenDate.toISOString();
                  let timeString = dateString.slice(11, 23) + dateString.slice(26, 29);
                  //end set up time
  
                  newGetAttendance.absenDateString = formattedDate;
                  newGetAttendance.absenTimeString = timeString;
                // set up date and time

                 newGetAttendance.userAttendance = arrayUserGetAttendance;
                arrayGetAttendance.push(newGetAttendance)
            }

            return res.status(201).json({
            message: "Sucessfuly get User Attendance",
            data: {
                    history: arrayGetAttendance,
                    onTime : onTime,
                    late: late,
                    notPresent :notPresent,
                    excuse: excuse
                }
            })
          } catch (error) {
            console.log("error:",error)
             return res.message({message:error})
          }
    },
    getUserAttendanceByAbsence: async (req, res)=>{
        const { absenceId } = req.params;
        try {
            const getUserAttendance = await UserAttendance.find({attendanceId:absenceId})
            .populate({path: 'userId', select: 'userName lastName firstName'})
            return res.status(201).json({
                message: "Sucessfuly get User Attendance by absence",
                data:getUserAttendance
                })
        } catch (error) {
        return res.status(500).json({message: "server error"}) 
        }
    }
}