const Admin = require('../models/Admin');
const User = require('../models/User');

const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');

module.exports = {
    addAdmin: async (req, res, next) =>{
        const { userName, password} = req.body
        console.log(req.body);
        try {
        const registAdmin = new Admin({
               username: userName, password, 
        })
        
        bcrypt.hash(req.body.password, 8, (error, hashedPassword)=> {
            if(error) {return next(error);}
            registAdmin.set('password', hashedPassword);
            registAdmin.save(error=> {
              if(error) {return next(error);}
              return res.status(200).json({
                message: "Registration Admin Success",
              });
            })
          });
        } catch (error) {
            return res.message({message:error})
        }
        },
    registration: async (req, res, next) =>{
    console.log(req.body)
        try {

            //get data from req.body
            const { 
                // firstName, lastName, 
                email, userName, password} = req.body
            
            //cari apakah email sudah terdaftar di user?
            const _userName = await User.findOne({userName, isAccepted: true})

            // console.log("user Name:",_userName)

            if(_userName){
                return res.status(200).json({
                    message: "UserName has been register",
                    })
            }

            //cari apakah username tersebut sudah ada?
            const users =  await User.find({userName: userName, isAccepted: true})

            //jika userName dan email tidak terdaftar, baru bisa registrasi
            if(users.length == 0){
                    const registUser = new User({
                            // firstName, lastName, 
                            email, userName, password, 
                            isActive: true, isAccepted: true, 
                            role: 'member'
                    })
                    
                    bcrypt.hash(req.body.password, 10, (error, hashedPassword)=> {
                        if(error) {return next(error);}
                        registUser.set('password', hashedPassword);
                        registUser.save(error=> {
                          if(error) {return next(error);}
                          return res.status(200).json({
                            message: "Registration Success",
                          });
                        })
                      });
            }
            else{
                return res.status(200).json({
                    message: "user allready exist",
                    })
            }

          } catch (error){
            return res.message({message:error})
          }
    },
    login: async (req, res, next) =>{
        // console.log("req.body:",req.body);
        try {
            const { userName, password} = req.body
            const user = await User.findOne({userName});
            if(!user) {
                return res.status(200).json({message: "user not found"});
            }
            const validate = await bcrypt.compare(password, user.password);
            if (!validate) {
                return res.status(200).json({ message: 'wrong password' });
            }

            // console.log("user._id:",user._id);
            return res.status(201).json({ 
                message: 'user successfuly login', 
                role: `${user.role}`,
                status: `${user.isActive}`,
                division: `${user.division}`,
                id: `${user._id}`,
                email: `${user.email}`,
                firstName: `${user.firstName}`,
                lastName: `${user.lastName}`,
                
            })
          } catch (error){
                return res.status(500).json({ message: "server error" })
          }
    },

    forgotPassword: async (req, res, next) =>{
        try {
                const { userName, email, password} = req.body;
                await User.findOne({userName:userName, email: email})
                .then((update)=>{
                    bcrypt.hash(password, 10, (error, hashedPassword)=> {
                        if(error) {return next(error);}
                        update.set('password', hashedPassword);
                        update.save();
                    });
                })
                .then(result =>{
                   return res.status(201).json({
                        message: 'Update Password Sucess',
                    })
                })
                .catch((e)=>{
                   return res.status(200).json({
                        message: 'user or email is not found or matching',
                    })
                })
            }
            catch (error){
                return res.status(500).json({ message: "server error" })
          }
    },
    
    users: async (req, res, next) =>{
        try {
            const users =  await User.find()
            return res.status(201).json({
                message: "All user Successfuly find",
                data: users
            })
          } catch (error){
            return res.status(500).json({ message: "server error" })
          }
    },

    updateUser: async (req, res, next) =>{
        try {
            const { userId} = req.params;
            const { firstName, lastName, email, password, division} = req.body
            await User.findOne({_id: userId })
            .then((update)=>{
                // console.log("firstname:", firstName !== '' && firstName !== undefined ? firstName : update.firstName)
                const hashedPassword = password !== '' && password !== undefined ? bcrypt.hashSync(password, 10) : update.password;
                update.password = hashedPassword;
                update.firstName = firstName !== '' && firstName !== undefined ? firstName : update.firstName
                update.lastName = lastName !== '' && lastName !== undefined ? lastName : update.lastName
                update.email = email !== '' && email !== undefined ? email : update.email
                update.division = division !== '' && division !== undefined ? division : update.division
                return update.save()
            })
            .then(result =>{
                // console.log("result:",result)
                return res.status(201).json({
                    message: 'Update user Sucess',
                    role: `${result.role}`,
                    status: `${result.isActive}`,
                    division: `${result.division}`,
                    id: `${result._id}`,
                    email: `${result.email}`,
                    firstName: `${result.firstName}`,
                    lastName: `${result.lastName}`,
                    password: `${result.password}`,
                    userName: `${result.userName}`,
                })
            })
            .catch((e)=>{
                return res.status(200).json({
                    message: 'user is not found',
                })
            })
          } catch (error){
            return res.status(500).json({ message: "server error" })
          }
    },

    sendEmail: async(req, res, next) =>{
                try {
                    const EMAIL = 'vocs.uk.app@gmail.com'
                    const PASSWORD = 'rzjmuhufeqmagrph'

                const { userEmail, userName, token } = req.body;

                const findUser = await User.findOne({userName:userName, email: userEmail})
                
                if(!findUser){
                    return res.status(201).json({
                        message: "Username and email is not match"
                    })
                }

                let config = {
                    service : 'gmail',
                    auth : {
                        user: EMAIL,
                        pass: PASSWORD
                    }
                }

                let transporter = nodemailer.createTransport(config);

                let MailGenerator = new Mailgen({
                    theme: "default",
                    product : {
                        // name: "Mailgen",
                        name: "Your token has arrived!",
                        link : 'https://mailgen.js/'
                    }
                })

                let response = {
                    body: {name : `Your Token: ${token}`}
                }
                let mail = MailGenerator.generate(response)
                let message = {
                    from : EMAIL,
                    to : userEmail,
                    subject: "Your token has arrived",
                    html: mail
                }
                await transporter.sendMail(message).then(() => {
                    return res.status(201).json({
                        message: "you should receive an email"
                    })
                }).catch(error => {
                    return res.status(500).json({message: "server error"})
                })
                } catch (error) {
                    return res.status(500).json({ message: "server error" })
                }
       },
}