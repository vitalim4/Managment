//load routes
var userRoute = require('./routes/route.user.serverside');
var projectRoute = require('./routes/route.project.serverside.js');
var projectflowRoute = require('./routes/route.projectflow.serverside');
var departmentRoute = require('./routes/route.department.serverside');
var semesterRoute = require('./routes/route.semester.serverside');
var yearRoute = require('./routes/route.year.serverside');
var roleRoute = require('./routes/route.role.serverside');
var collegeRoute = require('./routes/route.college.serverside');


//load models
var projectModel = require('./models/model.project.serverside');
var userModel = require('./models/model.user.serverside');
var requestModel = require('./models/model.approve-request.serverside');


//else
var auth = require('./routes/route.auth.serverside');
var config = require('./config/sysConfig');
var nodemailer = require('nodemailer');
var mongoose = require('mongoose');                     // mongoose for mongodb
var multer = require('multer');    // pull information from HTML POST (express4)
var randomstring = require('just.randomstring');
const expressJwt = require('express-jwt');
const authenticate = expressJwt({secret: config.jwtSecret});
const passport = require('passport');
require('./config/passport.conf')(passport);
var jwt = require("jwt-simple");
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var async = require('async');
var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var fs = require('fs');


// expose the routes to our app with module.exports
module.exports = function (app) {
    /******************************************************************/
    /************************Users*************************************/
    /******************************************************************/

    /* Handle Logout */
    app.get('/signout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/api/manager/', authenticate, projectRoute.getRequestsByManager);
    app.post('/api/manager/request/reject/:requestid', authenticate, projectRoute.rejectApprovalRequest);
    app.post('/api/manager/request/accept/:requestid', authenticate, projectRoute.acceptApprovalRequest);
    app.post('/api/manager/request/comment/:requestid', authenticate, projectRoute.sendCommentToLecturers);
    app.get('/api/manager/projects/', authenticate, projectRoute.getProjectsByManager);
    app.get('/api/lecturer/reports/projects/', authenticate, projectRoute.getProjectsByLecturer);
    app.get('/api/lecturer/projects/', authenticate, projectRoute.getByLecturer);
    app.get('/api/archive/lecturer/projects/', authenticate, projectRoute.getArchivedProjectsByLecturer);
    app.get('/api/projects/all/archive',authenticate,projectRoute.getAllArchivedProjects)
    app.get('/api/student/projects/', authenticate, projectRoute.getProjectsByStudent);
    app.post('/api/submit/grade', authenticate, projectRoute.submitGrade); //not implemented yet
    app.get('/api/getnotifications/byproject/:projectid', authenticate, projectRoute.getNotifications);
    app.get('/api/manager/request/:requestId', authenticate, projectRoute.getRequestById);
    app.get('/api/manager/archive/', authenticate, projectRoute.getRequestsArchiveByManager);
    app.delete('/api/manager/project/:projectId', authenticate, projectRoute.deleteProjectByManager);
    app.get('/api/manager/approve/ask-for-approval/:project', authenticate, projectRoute.sendApprovalRequest);
    app.get('/api/manager/users/:role/:reporttype', authenticate, userRoute.getUsersReportsByManager);
    app.get('/api/manager/users/', authenticate, userRoute.getUsersByManager);
    app.get('/api/manager/project-filters/', authenticate, userRoute.getFiltersByManager);
    app.get('/api/users/not-in-project/:role/:college/:project', authenticate, userRoute.getUsersNotInProject);
    app.get('/api/tags/for-project/texts/', authenticate, projectRoute.getAllTagsTextByDepartment);
    app.get('/api/tags/for-project/weight/', authenticate, projectRoute.getAllTagsWWeight);
    app.get('/api/lecturers/for-project/', authenticate, userRoute.getLecturersInProjects);
    app.get('/api/lecturers/for-charts/', authenticate, userRoute.getAllLecturers);
    app.get('/api/user/usernames/', authenticate, userRoute.getUsernames);
    app.post('/forgot', userRoute.resendPasswordToken);
    app.get('/api/user/get-current', authenticate, userRoute.getCurrentUser);
    app.get('/api/users/for-project/:role', authenticate, userRoute.getByDepartmentRole);
    app.get('/api/users/for-project/:role/:depname', authenticate, userRoute.getLecturersByDepartment);

    app.route('/api/users')
    // get all users
        .get(authenticate, function (req, res) {
            return userRoute.getAll(req, res);
        })
        .put(authenticate, function (req, res) {
            return userRoute.saveUser(req, res);
        });

    app.route('/api/user/:userId')
        .get(authenticate, function (req, res) {
            return userRoute.getSingle(req, res);
        })
        .put(authenticate, function (req, res) {
            return userRoute.saveUser(req, res);
        });

    app.route('/reset/:token')
        .get(userRoute.resetPasswordRequest)
        .post(userRoute.resetPasswordSuccessEmail);


    /******************************************************************/
    /************************Projects**********************************/
    /******************************************************************/
    app.get('/api/projects', authenticate, projectRoute.getAll);
    app.get('/api/projects/filter', authenticate, projectRoute.getByDepartment);
    /* app.get('/api/projects/gbyname/:projengname', function (req, res) {
     return projectRoute.getByEngName(req, res);
     });*/
    app.post('/api/project/updatestage/:requestid', authenticate, projectRoute.updateProjectsStatus);
    app.post('/api/project/uncheckstage/:requestid', authenticate, projectRoute.uncheckProjectsStatus);
    app.get('/api/project/:id', authenticate, projectRoute.getSingle);
    app.post('/api/projects/save', authenticate, projectRoute.save);
    app.post('/api/projects/end-of-proj', authenticate, projectRoute.save_end_proj);
    app.post('/api/project/addstudent', authenticate, projectRoute.addStudent);
    app.post('/api/project/removestudent', authenticate, projectRoute.removeStudent);
    app.post('/api/project/filter', authenticate, projectRoute.filterProjects);
    app.post('/api/project/advanced-filter', authenticate, projectRoute.advancedFilterProjects);
    app.get('/api/projects/get-stages', authenticate, projectRoute.getAllStages); 
    //app.get('/api/projects/get-statuses', authenticate, projectRoute.getAllStatuses); //not used
    app.post('/api/submission', authenticate, projectRoute.AddSubmission);
    app.get('/api/project/archive/:projId/:doc', authenticate, projectRoute.uploadDocPdf);
    app.get('/api/manager/project-filters/:projtype', authenticate, userRoute.getFiltersBymangerAndProjType);

    /******************************************************************/
    /************************Project Flow******************************/
    /******************************************************************/
    app.get('/api/projectsflow/colleges', authenticate, projectflowRoute.getColleges);
    app.get('/api/projectsflow/colleges/filter', authenticate, projectflowRoute.getTypes);
    app.get('/api/projectsflow/for-filter/:collegeslug/:departmentslug', function (req, res) {
        return projectflowRoute.getTypesAsStrings(req, res);
    });
    app.get('/api/projectsflow/getflow/colleges/:collegeslug/:departmentslug/:typeslug', function (req, res) {
        return projectflowRoute.getFlow(req, res);
    });
    app.get('/api/projectsflow/colleges/:collegeslug/:departmentslug/:typeslug/:statusslug', function (req, res) {
        return projectflowRoute.getStages(req, res);
    });

    /******************************************************************/
    /************************Interest**********************************/
    /******************************************************************/

    app.post('/api/interest', authenticate, function (req, res) {
        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');

        var studentEmail = req.user.Email;
        var studentName = req.user.firstName + ' ' + req.user.lastName;
        var Explanation = req.body.Eexplain;
        var AdditionalStudents = req.body.EmoreStudents;
        var projectId = req.body.projectId;

        var lecturersDetailsForStudent = [];
        projectModel.findById
        (
            projectId,
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                if (projs.lecturers) {
                    var lecturersinProject = projs.lecturers;

                    var usersIds = lecturersinProject.map(function (item) {
                        var ObjectId = mongoose.Types.ObjectId;
                        var result = new ObjectId(item.id);
                        return result
                    });

                    userModel.find({"_id": {$in: usersIds}, "Role.Slug": 'lecturer'}, function (error, resUsers) {

                        if (error) {
                            console.log('in user router error');
                            return error;
                        }
                        else {
                            if (!resUsers) {
                                console.log('in user router empty');
                                return fn(error);
                            }
                            else {

                                var emailObject = {
                                    studentName: studentName,
                                    studentEmail: studentEmail,
                                    projectName: projs.nameHeb,
                                    explanation: Explanation,
                                    additionalStudents: AdditionalStudents,
                                };

                                for (var i = 0, l = resUsers.length; i < l; i++) {

                                    lecturersDetailsForStudent.push({
                                        "name": resUsers[i].firstName + ' ' + resUsers[i].lastName,
                                        "email": resUsers[i].Email
                                    });

                                    emailObject.lecturerFirstName = resUsers[i].firstName;

                                    var templateDir = path.join(__dirname, 'email-templates', 'interest/lecturer');
                                    var interestHTML = new EmailTemplate(templateDir);


                                    interestHTML.render(emailObject, function (err, result) {
                                        var mailOptions = {
                                            from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                                            to: studentEmail, // list of receivers
                                            subject: 'הבעת התעניינות ' + emailObject.projectName, // Subject line
                                            html: result.html
                                        };

                                        // send mail with defined transport object
                                        transporter.sendMail(mailOptions, function (error, info) {
                                            if (error) {
                                                return console.log(error);
                                            }
                                            console.log('Message sent: ' + info.response);
                                        });


                                    });
                                }

                            }


                            var templateDir = path.join(__dirname, 'email-templates', 'interest/student');
                            var interestHTML = new EmailTemplate(templateDir);

                            emailObject.lecturersDetailsForStudent = lecturersDetailsForStudent;

                            interestHTML.render(emailObject, function (err, result) {
                                var mailOptions = {
                                    from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                                    to: studentEmail, // list of receivers
                                    subject: 'סמי שמעון - פרוייקט - ' + projs.nameHeb, // Subject line
                                    html: result.html
                                };

                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        return console.log(error);
                                    }
                                    console.log('Message sent: ' + info.response);
                                });

                                res.status(200);
                                res.end();
                            });
                        }
                    });
                }

            });
    });
    app.post('/api/request/:id', authenticate, function (req, res) {
        requestModel.findById(req.params.id, function (err, resRequest) {
            if (err)
                return res.send(err)

            res.json(resRequest);
        });
    });
    app.get('/logout', function (req, res, next) {
        req.session.destroy();
        res.status(200);
        return res.end();
    });
    app.post('/authenticate', function (req, res, next) {
        passport.authenticate('local-login', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).send();

            }
            req.logIn(user, function (err) {
                // if user is found and password is right create a token
                var token = jwt.encode(user, config.jwtSecret);
                // return the information including token as JSON
                userDetails = {
                    //id:user._id,
                    name: user.firstName + ' ' + user.lastName,
                    role: user.Role.Name,
                    roleslug: user.Role.Slug,
                    campus: user.College.Name,
                    department: user.Department.Name,
                    departmentEng: user.Department.Slug,
                    inProcess: user.inProcess,
                    inGroup: user.inGroup,
                    college: user.College.Slug
                }

                res.status(200);
                var s = JSON.stringify({success: true, token: token, user: userDetails});
                return res.end(s);
            });
        })(req, res, next);
    });

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, 'C:/Users/Administrator/WebstormProjects/FPM-AngularJS/public/uploads');
            //cb(null, '/Users/vitaly/Desktop/RonenMars-nodefpm-ace6640c93ef/public/uploads/');
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
        }
    });
    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    /** API path that will upload the files */
    app.post('/upload', function (req, res) {

        upload(req, res, function (err) {
            if (err) {
                console.log(err);
                res.json({error_code: 1, err_desc: err});
                return;
            }

            var resFile = req.file.path;
            res.json({error_code: 0, err_desc: null, data: resFile});
        });
    });
    app.post('/api/users/import', authenticate, userRoute.importUsersCSV);
    app.get('/api/users/import/download', function(req, res){
        var file =  path.join(__dirname, 'csv-template', 'csv-template.csv');
        res.download(file); // Set disposition and send it.
    });
    app.get('/api/download/archive/:filename', function(req,res){
        res.download("public/uploads/"+req.params.filename, req.params.filename);
    })
    app.get('/api/roles', authenticate, roleRoute.getAll);
    app.get('/api/roles/archive', authenticate, roleRoute.getAllForArchive);
    app.get('/api/departments', authenticate, departmentRoute.getAll);
    app.get('/api/departments/archive', authenticate, departmentRoute.getAllForArchive);
    app.get('/api/semesters', authenticate, semesterRoute.getAll);
    app.get('/api/years', authenticate, yearRoute.getAll);
    app.get('/api/colleges', authenticate, collegeRoute.getAll);
    app.get('/api/colleges/archive', authenticate, collegeRoute.getAllForArchive);
};
