const router = require('express').Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.get('/signin', adminController.viewSignin);
router.post('/signin', adminController.actionSignin);
router.use(auth);
router.get('/logout', adminController.actionLogout);
router.get('/dashboard', adminController.viewDashboard);

//endpoint list absen
router.get('/absen', adminController.viewAbsen);

//endpoint list member
router.get('/member', adminController.viewMember); // viewe all member (active instead inactive)
router.delete('/member/:id', adminController.deleteMember); // Delete member (active instead inactive)
router.put('/member/status/:id', adminController.updateStatusMember); // Delete member (active instead inactive)
router.put('/registeredmember/:id/:username/:email', adminController.AcceptMember); // Delete member (active instead inactive)

//enpoint reset password
router.put('/member/password/:id', adminController.resetPasswordMember); // Delete member (active instead inactive)

//enpoint update role
router.put('/member/role/:id', adminController.updateRoleMember); // Delete member (active instead inactive)

module.exports = router;