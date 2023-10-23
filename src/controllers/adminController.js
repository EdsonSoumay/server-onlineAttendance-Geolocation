const Member = require('../models/User')

const Admin = require('../models/Admin');
const fs = require('fs-extra')
const path = require('path');
const bcrypt = require('bcryptjs')

const Attendance = require('../models/Attendance');
const UserAttendance = require('../models/UserAttendance');

const ejs = require("ejs");
const pdf = require("html-pdf");

module.exports = {
    viewSignin: async (req, res) =>{
        try {
            const alertMessage = req.flash('alertMessage');
            const alertStatus = req.flash('alertStatus');
            const alert = { message: alertMessage, status: alertStatus}

            //ini kondisi agar admin sudah tidak bisa mengakses login ketika sudah login
            if (req.session.user == null || req.session.user == undefined) {
                //jika nd ada user, halaman yang ditampilkan adalah login
                res.render('index' ,{alert, title: 'Online Attendance | Login'}); //{} = cara mendustructurisasi category
              } else {
                //tapi kalo ada user.sesion, halaman dashboard yang ditampilkan
               res.redirect('/admin/dashboard')
              }
        } catch (error) {
            res.redirect('/admin/signin')
        }
    },
    actionSignin: async (req, res) => {
        try {
          const { username, password } = req.body;
        //   console.log(req.body);
          const user = await Admin.findOne({ username: username });
        //   console.log("user:",user);
          if (!user) {
            req.flash('alertMessage', 'User yang anda masukan tidak ada!!');
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/signin');
          }
          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
            req.flash('alertMessage', 'Password yang anda masukan tidak cocok!!');
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/signin');
          }
    
         // untuk sesion user
          req.session.user = {
            id: user.id,
            username: user.username
          }
    
          res.redirect('/admin/dashboard');
    
        } catch (error) {
          res.redirect('/admin/signin');
        }
      }, 
      actionLogout: (req, res)=>{
        req.session.destroy(); // hapus sesision
        res.redirect('/admin/signin'); // redirect ke sign in
      },
    viewDashboard: async (req, res) =>{
        try {
            const allMember = await Member.find();
            const activeMember = await Member.find({isActive: true, isAccepted: true});
            res.render('admin/dashboard/view_dashboard',{
                title : 'Online Attendance | Dashboard',
                user: "user testing",
                allMember,
                activeMember,
            });
        } catch (error) {
            res.redirect('/admin/dashboard')
        }
        
    },

    viewAbsen: async (req, res) =>{
        try {

            const { schoolYear, semester } = req.query;
            let arrayGetAttendance = []
            let schoolYears = []
                
            let getSchoolYears = await Attendance.find({status: true})
            
                //check tahun ajaran
                for(let i = 0; i < getSchoolYears.length; i++){
                    if(!schoolYears.includes(getSchoolYears[i].schoolYear)){
                      schoolYears.push(getSchoolYears[i].schoolYear)
                    }
                }

            const defaultSchoolYear = '2023-2024'
            const defaultSemester = '1'
           
            // cari semua absen
            let getAttendance; 
            if(schoolYear, semester){
              getAttendance = await Attendance.find({status: true, schoolYear:schoolYear, semester: semester})
              .sort({absenDate: 1})
            }
            else{
              getAttendance = await Attendance.find({status: true, schoolYear: defaultSchoolYear, semester: defaultSemester})
             .sort({absenDate: 1})
            }

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
                // console.log("typeof:", typeof getAttendance[i].absenDate);

                //set up date
                let day = getAttendance[i].absenDate.toLocaleDateString('en-US', {weekday: 'long'});
                let dateNumber = getAttendance[i].absenDate.toLocaleDateString('en-US', {day: '2-digit'});
                let month = getAttendance[i].absenDate.toLocaleDateString('en-US', {month: '2-digit'});
                let year = getAttendance[i].absenDate.toLocaleDateString('en-US', {year: 'numeric'});
                let formattedDate = day + ', ' + dateNumber + ' - ' + month + ' - ' + year;
                //end set up date

                //set up time GMT 8 (WITA)
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

            // console.log("get member:",getMember);
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
            // console.log("aray get attendance:",arrayGetAttendance[0].absenDate.day);

            const alertMessage = req.flash('alertMessage');
            const alertStatus = req.flash('alertStatus');
            const alert = { message: alertMessage, status: alertStatus}
            res.render('admin/absen/view_absen' ,{

                date: arrayGetAttendance, 
                member: newArrayobject2,
                alert, 
                action: 'view',
                title: 'Online Attendance | Absen',
                user: "user testing",
                schoolYear: schoolYear? schoolYear : defaultSchoolYear,
                semester: semester? semester : defaultSemester,
                filterSchoolYear: schoolYears

            }); 
  
          } catch (error) {
            //   console.log("error:",error);
          }
    },

    generateAbsenceReport: async (req, res) =>{
        try {
            const { semester, schoolYear } = req.query;
    
            let arrayGetAttendance = []
            let schoolYears = []
                
            let getSchoolYears = await Attendance.find({status: true})
            
                //check tahun ajaran
                for(let i = 0; i < getSchoolYears.length; i++){
                    if(!schoolYears.includes(getSchoolYears[i].schoolYear)){
                      schoolYears.push(getSchoolYears[i].schoolYear)
                    }
                }
    
            const defaultSchoolYear = '2023-2024'
            const defaultSemester = '1'
           
            // cari semua absen
            let getAttendance; 
            if(schoolYear, semester){
              getAttendance = await Attendance.find({status: true, schoolYear:schoolYear, semester: semester})
              .sort({absenDate: 1})
            }
            else{
              getAttendance = await Attendance.find({status: true, schoolYear: defaultSchoolYear, semester: defaultSemester})
             .sort({absenDate: 1})
            }
    
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
                // console.log("typeof:", typeof getAttendance[i].absenDate);
    
                //set up date
                // let day = getAttendance[i].absenDate.toLocaleDateString('en-US', {weekday: 'long'});
                let dateNumber = getAttendance[i].absenDate.toLocaleDateString('en-US', {day: '2-digit'});
                let month = getAttendance[i].absenDate.toLocaleDateString('en-US', {month: '2-digit'});
                let year = getAttendance[i].absenDate.toLocaleDateString('en-US', {year: 'numeric'});
                // let formattedDate = day + ', ' + dateNumber + ' - ' + month + ' - ' + year;
                let formattedDate = dateNumber + '-' + month + '-' + year;
                //end set up date
    
                //set up time GMT 8 (WITA)
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
    
            // console.log("get member:",getMember);
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
            // console.log("aray get attendance:",arrayGetAttendance[0].absenDate.day);
    
                ejs.renderFile(path.join('./src/views/report-template', "index.ejs"), {
                    date: arrayGetAttendance, 
                    member: newArrayobject2,
                    user: "user testing",
                    schoolYear: schoolYear? schoolYear : defaultSchoolYear,
                    semester: semester? semester : defaultSemester,
                    filterSchoolYear: schoolYears
                }, (err, data) => {
                    if (err) {
                        res.send(err);
                    } else {
                        let options = {
                            "format": "A3", // Format A4 untuk ukuran kertas A4
                            // "format": [1000000, 297], // 
                            "orientation": "landscape", // Mengatur orientasi menjadi lanskap
                            "header": {
                                "height": "20mm",
                            },
                            "footer": {
                                "height": "20mm",
                            },
                        };
                        pdf.create(data, options).toStream((err, stream) => {
                            if (err) {
                                res.send(err);
                            } else {
                                // Set header to force download
                                res.setHeader('Content-Disposition', 'attachment; filename=edson.pdf');
                                res.setHeader('Content-Type', 'application/pdf');
                                // Pipe the PDF data directly to the response stream
                                stream.pipe(res);
                            }
                        });
                    }
                });
        } catch (error) {
            return res.message({message:error})
        }
    },

    editAbsen: async (req, res) =>{
       
    },

    viewMember:  async (req, res) =>{
        try {
            const member = await Member.find({isAccepted: true})
            const registeredMember = await Member.find({isAccepted: false})
            
            const alertMessage = req.flash('alertMessage');
            const alertStatus = req.flash('alertStatus');
            const alert = { message: alertMessage, status: alertStatus}
            // res.render('admin/member/view_member',{
                res.render('admin/member/view_member',{
                title : 'Online Attendance | Member',
                alert,
                member,
                registeredMember,
                action: 'view',
                user: "user testing"
            });
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member');
        }
    },

    deleteMember: async (req, res) =>{
        try {
            const { id } = req.params;
            await Member.findOne({
                _id: id
            }).then((e)=>{
                e.remove()
            })
            req.flash('alertMessage', 'Success Delete Member');
            req.flash('alertStatus', 'success');
            res.redirect('/admin/member');
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
        }
    },
    AcceptMember: async (req, res) =>{
        try {
            const { id, username, email } = req.params;
        //    console.log(id);
           const findUserName = await Member.findOne({userName: username, isAccepted: true, email: email})
           if(findUserName){
            req.flash('alertMessage', 'User Name or Email already register');
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member');
           }else{
                await Member.findOne({_id: id})
                .then((update)=>{
                        update.isAccepted =  true
                        update.isActive =  true
                        update.save()
                })
                .then(result =>{
                        req.flash('alertMessage', 'Success Accept member');
                        req.flash('alertStatus', 'success');
                        res.redirect('/admin/member');
                })
                .catch((e)=>{
                    req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
                    req.flash('alertStatus', 'danger');
                    res.redirect('/admin/member'); 
                })
            }
           
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
        }
    },
    resetPasswordMember: async (req, res) =>{
        try {
            const { id } = req.params;
        //    console.log(id);
           await Member.findOne({_id: id})
           .then((update)=>{
                update.password = '$2a$10$srguLsFco.WXhYGhLF7zI.l1NVzmr1hpXHlkDEDcIR7EUa3ol3joO' //encryt dari "password"
                update.save()
           })
           .then(result =>{
                req.flash('alertMessage', 'Success Reset password');
                req.flash('alertStatus', 'success');
                res.redirect('/admin/member');
           })
           .catch((e)=>{
            req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
           })
           
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
        }
    },

    updateRoleMember: async (req, res) =>{
        try {
            const { id } = req.params;
            const { role } = req.body;
            // console.log("Role:",role);
            // console.log(id);
        
            let findRole = null;
            if(role != 'Member'){
                 findRole = await Member.findOne({role: role})
            }
            if(findRole){
                req.flash('alertMessage', `Role ${role} was already exist`);
                req.flash('alertStatus', 'danger');
                res.redirect('/admin/member'); 
            }
            else{
                await Member.findOne({_id: id})
                .then((update)=>{
                     update.role =  role
                     update.save()
                })
                .then(result =>{
                     req.flash('alertMessage', 'Success Update Role member');
                     req.flash('alertStatus', 'success');
                     res.redirect('/admin/member');
                })
                .catch((e)=>{
                 req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
                 req.flash('alertStatus', 'danger');
                 res.redirect('/admin/member'); 
                })
            }
           
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
        }
    },
    updateStatusMember: async (req, res) =>{
        try {
            const { id } = req.params;
        //    console.log(id);
           await Member.findOne({_id: id})
           .then((update)=>{
                update.isActive =  !update.isActive
                update.save()
           })
           .then(result =>{
                req.flash('alertMessage', 'Success Update status member');
                req.flash('alertStatus', 'success');
                res.redirect('/admin/member');
           })
           .catch((e)=>{
            req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
           })
           
        } catch (error) {
            req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
            req.flash('alertStatus', 'danger');
            res.redirect('/admin/member'); 
        }
    },
}



////pake controller ini kalo pake user session
// const Member = require('../models/User')

// const Admin = require('../models/Admin');
// const fs = require('fs-extra')
// const path = require('path');
// const bcrypt = require('bcryptjs')

// const Attendance = require('../models/Attendance');
// const UserAttendance = require('../models/UserAttendance');


// module.exports = {
//     viewSignin: async (req, res) =>{
//         try {
//             const alertMessage = req.flash('alertMessage');
//             const alertStatus = req.flash('alertStatus');
//             const alert = { message: alertMessage, status: alertStatus}

//             //ini kondisi agar admin sudah tidak bisa mengakses login ketika sudah login
//             if (req.session.user == null || req.session.user == undefined) {
//                 //jika nd ada user, halaman yang ditampilkan adalah login
//                 res.render('index' ,{alert, title: 'Online Attendance | Login'}); //{} = cara mendustructurisasi category
//               } else {
//                 //tapi kalo ada user.sesion, halaman dashboard yang ditampilkan
//                res.redirect('/admin/dashboard')
//               }
//         } catch (error) {
//             res.redirect('/admin/signin')
//         }
//     },
//     actionSignin: async (req, res) => {
//         try {
//           const { username, password } = req.body;
//         //   console.log(req.body);
//           const user = await Admin.findOne({ username: username });
//         //   console.log("user:",user);
//           if (!user) {
//             req.flash('alertMessage', 'User yang anda masukan tidak ada!!');
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/signin');
//           }
//           const isPasswordMatch = await bcrypt.compare(password, user.password);
//           if (!isPasswordMatch) {
//             req.flash('alertMessage', 'Password yang anda masukan tidak cocok!!');
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/signin');
//           }
    
//          // untuk sesion user
//           req.session.user = {
//             id: user.id,
//             username: user.username
//           }
    
//           res.redirect('/admin/dashboard');
    
//         } catch (error) {
//           res.redirect('/admin/signin');
//         }
//       }, 
//       actionLogout: (req, res)=>{
//         req.session.destroy(); // hapus sesision
//         res.redirect('/admin/signin'); // redirect ke sign in
//       },
//     viewDashboard: async (req, res) =>{
//         try {
//             const allMember = await Member.find();
//             const activeMember = await Member.find({isActive: true, isAccepted: true});
//             res.render('admin/dashboard/view_dashboard',{
//                 title : 'Online Attendance | Dashboard',
//                 user: req.session.user,
//                 allMember,
//                 activeMember,
//             });
//         } catch (error) {
//             res.redirect('/admin/dashboard')
//         }
        
//     },

//     viewAbsen: async (req, res) =>{
//         try {

//             const { schoolYear, semester } = req.query;
//             let arrayGetAttendance = []
//             let schoolYears = []
                
//             let getSchoolYears = await Attendance.find({status: true})
            
//                 //check tahun ajaran
//                 for(let i = 0; i < getSchoolYears.length; i++){
//                     if(!schoolYears.includes(getSchoolYears[i].schoolYear)){
//                       schoolYears.push(getSchoolYears[i].schoolYear)
//                     }
//                 }

//             const defaultSchoolYear = '2023-2024'
//             const defaultSemester = '1'
           
//             // cari semua absen
//             let getAttendance; 
//             if(schoolYear, semester){
//               getAttendance = await Attendance.find({status: true, schoolYear:schoolYear, semester: semester})
//               .sort({absenDate: 1})
//             }
//             else{
//               getAttendance = await Attendance.find({status: true, schoolYear: defaultSchoolYear, semester: defaultSemester})
//              .sort({absenDate: 1})
//             }

//             // cari absen user
//             for(let i = 0; i < getAttendance.length; i++){

//                 let newGetAttendance = getAttendance[i]

//                 const getUserAttendance = await UserAttendance.find({attendanceId: getAttendance[i]._id})
//                                          .populate({path: 'userId', select: 'lastName firstName userName'})
            
//                 let arrayUserGetAttendance = []
//                 for(let i = 0; i < getUserAttendance.length; i++){
//                     arrayUserGetAttendance.push(getUserAttendance[i])
//                 }
  
//                 newGetAttendance.userAttendance = arrayUserGetAttendance;
//                 // console.log("typeof:", typeof getAttendance[i].absenDate);

//                 //set up date
//                 let day = getAttendance[i].absenDate.toLocaleDateString('en-US', {weekday: 'long'});
//                 let dateNumber = getAttendance[i].absenDate.toLocaleDateString('en-US', {day: '2-digit'});
//                 let month = getAttendance[i].absenDate.toLocaleDateString('en-US', {month: '2-digit'});
//                 let year = getAttendance[i].absenDate.toLocaleDateString('en-US', {year: 'numeric'});
//                 let formattedDate = day + ', ' + dateNumber + ' - ' + month + ' - ' + year;
//                 //end set up date

//                 //set up time GMT 8 (WITA)
//                 let utc_hours = getAttendance[i].absenDate.getUTCHours();
//                 utc_hours += 8;
//                 getAttendance[i].absenDate.setUTCHours(utc_hours);
//                 let dateString = getAttendance[i].absenDate.toISOString();
//                 let timeString = dateString.slice(11, 23) + dateString.slice(26, 29);
//                 //end set up time


//                 newGetAttendance.absenDateString = formattedDate;
             
//                 newGetAttendance.absenTimeString = timeString;

//                 arrayGetAttendance.push(newGetAttendance)
//             }


//             // cocokan dengan nama member
//             const getMember = await Member.find({isActive: true})

//             // console.log("get member:",getMember);
//             let newArrayobject2 = []
            
//             for(let i = 0; i < getMember.length; i++){
//                 let arrayObject = []
                
//                 for(let j = 0; j < arrayGetAttendance.length; j ++){

//                    const filterArray = arrayGetAttendance[j].userAttendance.filter(e =>e.userId?.userName == getMember[i].userName);
            
//                    if(filterArray){

//                     if(filterArray.length!= 0){
//                         arrayObject.push({
//                             userId:getMember[i]._id,
//                             userName:getMember[i].userName,
//                             firstName:getMember[i].firstName,
//                             lastName:getMember[i].lastName,
//                             presence:filterArray[0].presence,
//                             date: arrayGetAttendance[j].date_created
//                         })
//                     }
                    
//                     if(filterArray.length == 0){
//                         arrayObject.push({
//                             userId:getMember[i]._id,
//                             userName:getMember[i].userName,
//                             firstName:getMember[i].firstName,
//                             lastName:getMember[i].lastName,
//                             presence:'absen',
//                             date: arrayGetAttendance[j].date_created
//                         })
//                     }
//                    }
                    
//                 }
//                 newArrayobject2.push(arrayObject)
//             }
            
//             // console.log("new array obj 2:",newArrayobject2);
//             // console.log("aray get attendance:",arrayGetAttendance[0].absenDate.day);

//             const alertMessage = req.flash('alertMessage');
//             const alertStatus = req.flash('alertStatus');
//             const alert = { message: alertMessage, status: alertStatus}
//             res.render('admin/absen/view_absen' ,{

//                 date: arrayGetAttendance, 
//                 member: newArrayobject2,
//                 alert, 
//                 action: 'view',
//                 title: 'Online Attendance | Absen',
//                 user: req.session.user,
//                 schoolYear: schoolYear? schoolYear : defaultSchoolYear,
//                 semester: semester? semester : defaultSemester,
//                 filterSchoolYear: schoolYears

//             }); 
  
//           } catch (error) {
//             //   console.log("error:",error);
//           }
//     },

//     editAbsen: async (req, res) =>{
       
//     },

//     viewMember:  async (req, res) =>{
//         try {
//             const member = await Member.find({isAccepted: true})
//             const registeredMember = await Member.find({isAccepted: false})
            
//             const alertMessage = req.flash('alertMessage');
//             const alertStatus = req.flash('alertStatus');
//             const alert = { message: alertMessage, status: alertStatus}
//             // res.render('admin/member/view_member',{
//                 res.render('admin/member/view_member',{
//                 title : 'Online Attendance | Member',
//                 alert,
//                 member,
//                 registeredMember,
//                 action: 'view',
//                 user: req.session.user
//             });
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member');
//         }
//     },

//     deleteMember: async (req, res) =>{
//         try {
//             const { id } = req.params;
//             await Member.findOne({
//                 _id: id
//             }).then((e)=>{
//                 e.remove()
//             })
//             req.flash('alertMessage', 'Success Delete Member');
//             req.flash('alertStatus', 'success');
//             res.redirect('/admin/member');
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//         }
//     },
//     AcceptMember: async (req, res) =>{
//         try {
//             const { id, username, email } = req.params;
//         //    console.log(id);
//            const findUserName = await Member.findOne({userName: username, isAccepted: true, email: email})
//            if(findUserName){
//             req.flash('alertMessage', 'User Name or Email already register');
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member');
//            }else{
//                 await Member.findOne({_id: id})
//                 .then((update)=>{
//                         update.isAccepted =  true
//                         update.isActive =  true
//                         update.save()
//                 })
//                 .then(result =>{
//                         req.flash('alertMessage', 'Success Accept member');
//                         req.flash('alertStatus', 'success');
//                         res.redirect('/admin/member');
//                 })
//                 .catch((e)=>{
//                     req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//                     req.flash('alertStatus', 'danger');
//                     res.redirect('/admin/member'); 
//                 })
//             }
           
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//         }
//     },
//     resetPasswordMember: async (req, res) =>{
//         try {
//             const { id } = req.params;
//         //    console.log(id);
//            await Member.findOne({_id: id})
//            .then((update)=>{
//                 update.password = '$2a$10$srguLsFco.WXhYGhLF7zI.l1NVzmr1hpXHlkDEDcIR7EUa3ol3joO' //encryt dari "password"
//                 update.save()
//            })
//            .then(result =>{
//                 req.flash('alertMessage', 'Success Reset password');
//                 req.flash('alertStatus', 'success');
//                 res.redirect('/admin/member');
//            })
//            .catch((e)=>{
//             req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//            })
           
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//         }
//     },

//     updateRoleMember: async (req, res) =>{
//         try {
//             const { id } = req.params;
//             const { role } = req.body;
//             // console.log("Role:",role);
//             // console.log(id);
        
//             let findRole = null;
//             if(role != 'Member'){
//                  findRole = await Member.findOne({role: role})
//             }
//             if(findRole){
//                 req.flash('alertMessage', `Role ${role} was already exist`);
//                 req.flash('alertStatus', 'danger');
//                 res.redirect('/admin/member'); 
//             }
//             else{
//                 await Member.findOne({_id: id})
//                 .then((update)=>{
//                      update.role =  role
//                      update.save()
//                 })
//                 .then(result =>{
//                      req.flash('alertMessage', 'Success Update Role member');
//                      req.flash('alertStatus', 'success');
//                      res.redirect('/admin/member');
//                 })
//                 .catch((e)=>{
//                  req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//                  req.flash('alertStatus', 'danger');
//                  res.redirect('/admin/member'); 
//                 })
//             }
           
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//         }
//     },
//     updateStatusMember: async (req, res) =>{
//         try {
//             const { id } = req.params;
//         //    console.log(id);
//            await Member.findOne({_id: id})
//            .then((update)=>{
//                 update.isActive =  !update.isActive
//                 update.save()
//            })
//            .then(result =>{
//                 req.flash('alertMessage', 'Success Update status member');
//                 req.flash('alertStatus', 'success');
//                 res.redirect('/admin/member');
//            })
//            .catch((e)=>{
//             req.flash('alertMessage', `${e.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//            })
           
//         } catch (error) {
//             req.flash('alertMessage', `${error.message}`); // `$error.message` = `${error.message}`  (sama sja kek bgini)
//             req.flash('alertStatus', 'danger');
//             res.redirect('/admin/member'); 
//         }
//     },
// }