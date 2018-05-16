// load the needed models
var User = require('../models/model.user.serverside');
var Project = require('../models/model.project.serverside');
var Role = require('../models/model.role.serverside');
var Stage = require('../models/model.stage.serverside');
var Status = require('../models/model.status.serverside.js');
var ProjectFlow = require('../models/model.projectflow.serverside');
var Semester = require('../models/model.semester.serverside');
var Department = require('../models/model.department.serverside');
var College = require('../models/model.college.serverside');
var Year = require('../models/model.year.serverside');
var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var randomstring = require('just.randomstring');
var nodemailer = require('nodemailer');
var Promise = require('promise');


var resendPasswordToken = function (req, res) {
    //var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');
    var transporter = nodemailer.createTransport({
        host: 'smtp.googlemail.com',
        port: 25,
        secure: false, // secure:true for port 465, secure:false for port 587, port 20 not secure
        //service: 'Gmail',
        auth: {
            user: 'sce.fpm@gmail.com',
            pass: 'sce!131242'
        }
        //connectionTimeout: 1 * 60 * 1000
    });

    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            if (typeof req.body.data !== 'undefined' && req.body.data) {
                if (typeof req.body.data.Email !== 'undefined' && req.body.data.Email) {
                    EmailAddress = req.body.data.Email;
                }
            }
            else if (typeof req.body.email !== 'undefined' && req.body.email) {
                EmailAddress = req.body.email;
            }

            if (EmailAddress !== "") {
                User.findOne({Email: EmailAddress}, function (err, user) {

                    if (!user) {
                        res.status(500).send({error: 'No account with that email address exists.'});
                        return;
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function (err) {
                        done(err, token, user);
                    });
                });
            }
            else {
                console.log("no Email input");
                res.status(500).send({error: 'No account with that email address exists.'});
            }
        },
        function (token, user, done) {

            console.log("reqhost")
            console.log(req.headers.host)
            var mailOptions = {
                to: user.Email,
                from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                subject: 'SCE שחזור סיסמא למערכת',
                text: 'שלום,\n' +
                'הנך מקבל אי-מייל זה מכיוון שאתה (או מישהו אחר) שלח בקשה לשחזור הסיסמא של חשבונך\n\n' +
                'בכדי לשחזר את הסיסמא עלייך ללחוץ על הלינק הבא וא לחילופין להעתיק אותו לכתובת הדפדפן, על מנת לסיים את התהליך:' +
                'http://' + req.headers.host /*'147.235.162.50/'*//*req.headers.host*/ + '/#/reset/' + token + '\n\n' +
                'במידה ולא שלחת בקשה לשחזור סיסמא, אנא התעלם מהמייל וסיסמתך לא תשתנה.'
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
                console.log(user);
                res.status(200).send(user);
                res.end();
            });
        }
    ], function (err) {
        if (err)
            console.log(err);
        else
            res.status(500).send({error: 'Error happend'});
    });
};


module.exports = {
    login: function (innerUsername, innerPassword, fn) {
        var inUsername = innerUsername;
        var inPassword = innerPassword;
        var result = User.findOne({Username: inUsername, Password: inPassword}, function (error, resUser) {
            if (error) {
                console.log('in user router error');
                return error;
            }
            else {
                if (!resUser) {
                    console.log('in user router empty');
                    return fn(error);
                }
                else {
                    return fn(null, resUser);

                }
            }
        });
    },
    getFiltersBymangerAndProjTypeAndDep:function (req, res) {

        var inDepartment = req.user.Department.Slug;
        var typeProj = req.params.projtype;
        var depSlug = req.params.dep;
        var collegeSlug = req.params.collegeSlug;

        //lecturers
        User.find({
            $and: [{"Department.Slug": inDepartment}, {
                "Role.Slug": 'lecturer'
            }]
        }, function (err, resLecturers) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            var lecturers = resLecturers;

            //students
            User.find({
                $and: [{"Department.Slug": inDepartment}, {
                    "Role.Slug": 'student'
                }]
            }, function (err, resStudents) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                var students = resStudents;

                //stages
                ProjectFlow.find({
                    $and: [{"Type.Slug": typeProj},{"Department.Slug":depSlug},{"College.Slug":collegeSlug}]
                }, function (err, resStages) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err);
                    var stages = resStages[0].Stage;

                    //statuses
                    Status.find({
                        $and: [{"Department": inDepartment}]
                    }, function (err, resStatuses) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            res.send(err);

                        var statuses = resStatuses;

                        // use mongoose to get all users in the database
                        var inCollege = req.user.College.Slug;
                        var inDepartment = req.user.Department.Slug;

                        //flows
                        ProjectFlow.find
                        (
                            {"College.Slug": inCollege, "Department.Slug": inDepartment},
                            {'Type':1},
                            {},
                            function (err, deps) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err)
                                    res.send(err);

                                //res.json(deps); // return all departments in JSON format                          
                                var projectflows = deps;

                                //semesters
                                Semester.find({},{_id:false},function (err, semesters) {

                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err)
                                        res.send(err);

                                    //departments
                                    Department.find({},{_id:false},function (err, departments) {

                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                        if (err)
                                            res.send(err);

                                        //colleges
                                        College.find({},{_id:false},function (err, colleges) {

                                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                            if (err)
                                                res.send(err);

                                            //years
                                            Year.find({},{_id:false},function (err, years) {

                                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                                if (err)
                                                    res.send(err);

                                                var allFilters = {
                                                    lecturers: lecturers,
                                                    students: students,
                                                    stages: stages,
                                                    statuses: statuses,
                                                    projectflows: projectflows,
                                                    semesters: semesters,
                                                    pairedOpts: ["true", "false"],
                                                    approvalOpts: ["true", "false"],
                                                    departments: departments,
                                                    colleges: colleges,
                                                    years: years
                                                };

                                                res.status(200).send(allFilters);
                                            });
                                        });
                                    });
                                });
                            });
                    });
                });
            });
        });
    },
    getFiltersBymangerAndProjType:function (req, res) {

        var inDepartment = req.user.Department.Slug;
        var typeProj = req.params.projtype;

        //lecturers
        User.find({
            $and: [{"Department.Slug": inDepartment}, {
                "Role.Slug": 'lecturer'
            }]
        }, function (err, resLecturers) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            var lecturers = resLecturers;

            //students
            User.find({
                $and: [{"Department.Slug": inDepartment}, {
                    "Role.Slug": 'student'
                }]
            }, function (err, resStudents) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                var students = resStudents;

                //stages
                ProjectFlow.find({
                    $and: [{"Type.Slug": typeProj}]
                }, function (err, resStages) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err);

                    var stages = resStages[0].Stage;

                    //statuses
                    Status.find({
                        $and: [{"Department": inDepartment}]
                    }, function (err, resStatuses) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            res.send(err);

                        var statuses = resStatuses;

                        // use mongoose to get all users in the database
                        var inCollege = req.user.College.Slug;
                        var inDepartment = req.user.Department.Slug;

                        //flows
                        ProjectFlow.find
                        (
                            {"College.Slug": inCollege, "Department.Slug": inDepartment},
                            {'Type':1},
                            {},
                            function (err, deps) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err)
                                    res.send(err);

                                //res.json(deps); // return all departments in JSON format                          
                                var projectflows = deps;

                                //semesters
                                Semester.find({},{_id:false},function (err, semesters) {

                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err)
                                        res.send(err);

                                    //departments
                                    Department.find({},{_id:false},function (err, departments) {

                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                        if (err)
                                            res.send(err);

                                        //colleges
                                        College.find({},{_id:false},function (err, colleges) {

                                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                            if (err)
                                                res.send(err);

                                            //years
                                            Year.find({},{_id:false},function (err, years) {

                                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                                if (err)
                                                    res.send(err);

                                                var allFilters = {
                                                    lecturers: lecturers,
                                                    students: students,
                                                    stages: stages,
                                                    statuses: statuses,
                                                    projectflows: projectflows,
                                                    semesters: semesters,
                                                    pairedOpts: ["true", "false"],
                                                    approvalOpts: ["true", "false"],
                                                    departments: departments,
                                                    colleges: colleges,
                                                    years: years
                                                };

                                                res.status(200).send(allFilters);
                                            });
                                        });
                                    });
                                });
                            });
                    });
                });
            });
        });
    },		
	


    getLecturersByDepartment:function(req,res){
        var inDepartment = req.user.Department.Slug;
        var departmentName = req.params.depname;
        var inRole = req.params.role;

        if (inRole === 'lecturer') {
            User.find({
                $and: [{"Department.Slug": departmentName}, {
                    "Role.Slug": inRole
                }]
            }, function (err, users) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);
                res.json(users); // return all users in JSON format
            });
        }
        else{
            res.status(401).send({error: 'Not authorized user.'});
        }
    },
    getByDepartmentRole: function (req, res) {
        var inDepartment = req.user.Department.Slug;
        var inRole = req.params.role;

        if (inRole === 'lecturer') {
            User.find({
                $and: [{"Department.Slug": inDepartment}, {
                    "Role.Slug": inRole
                }]
            }, function (err, users) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);
                res.json(users); // return all users in JSON format
            });
        }
        else {
            User.find({
                $and: [{
                    "Department.Slug": inDepartment
                }, {
                    "Role.Slug": inRole
                }, {
                    "inGroup": false
                }]
            }, function (err, users) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.json(users); // return all users in JSON format
            });
        }
    },

    saveUser: function (req, res) {

        var inUser = new User(req.body.data);

        if (inUser) {
            if (!req.body.data.creation) {
                var lastModifiedX = new Date();

                var userId = inUser._id;

                User.findOneAndUpdate(
                    {_id: userId},
                    {
                        $set: {
                            'firstName': inUser.firstName,
                            'lastName': inUser.lastName,
                            'Email': inUser.Email,
                            'Department': inUser.Department,
                            'Semester': inUser.Semester,
                            'Year': inUser.Year,
                            'Phone': inUser.Phone,
                            'Role': inUser.Role,
                            'College': inUser.College,
                            'Birthday': inUser.Birthday,
                            'Username': inUser.Username,
                            'inProcess': inUser.inProcess,
                            'inGroup': inUser.inGroup,
                            'gender': inUser.gender
                        }
                    },
                    {upsert: true},
                    function (err, userUpdated) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);
                        res.status(200);
                        res.send(userUpdated);
                        //$location.path('/account/manager/users');
                    });


            }
            else {
                inUser.inProcess = 0;
                inUser.inGroup = 0;
                inUser.gender = 0;

                if (inUser.Birthday === null)
                    inUser.Birthday = new Date();

                inUser.save(function (err, savedUser) {

                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err) {
                        console.log(err);

                        return res.send(err);
                    }


                    req.params.userID = savedUser._id;

                    resendPasswordToken(req, res);
                    /*
                    Response sent inside resendPasswordToken(req, res);
                    res.status(200).send(savedUser);
                    res.end();*/
                });
            }

        }
    },


    //resendPassword: resendPassword,


    getLecturersInProjects: function (req, res) {
        var inDepartment = req.user.Department.Slug;
        var inCollege = req.user.College.Slug;

        /*Project.aggregate(
            {"$unwind": "$lecturers"},

            {
                $match: {"flow.Department.Slug": inDepartment, "flow.College.Slug": inCollege}
            },
            {"$group": {_id: {"id": "$lecturers.id", "name": "$lecturers.name"}}}
            , function (err, users) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.json(users); // return all users in JSON format
            });*/

            var lectures = [];
            var cursor = Project.aggregate(
                {"$unwind": "$lecturers"},
    
                {
                    $match: {"flow.Department.Slug": inDepartment, "flow.College.Slug": inCollege}
                },
                {"$group": {_id: {"id": "$lecturers.id", "name": "$lecturers.name"}}}
                ).cursor({ batchSize: 1000 }).exec();
                cursor.forEach(function(doc) {
                    lectures.push(doc);
                  }, function (err) {
                    if (err) return res.send(err);
                    res.json(lectures);
                  });
    },
    getAllLecturers: function (req, res) {

        Project.aggregate(
            {"$unwind": "$lecturers"},
            {"$group": {_id: {"id": "$lecturers.id", "name": "$lecturers.name"}}}
            , function (err, users) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.json(users); // return all users in JSON format
            });
    },
    resetPasswordRequest: function (req, res) {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {$gt: Date.now()}
        }, function (err, user) {
            if (!user) {
                //req.flash('error', 'פג תוקף לינק השחזור או שהלינק איננו תקין.');
                return res.status(400).send({error: 'Error happend'});
            }
            res.status(200);
            res.json(user);
            res.end();

        });
    },
    importUsersCSV: function (req, res) {

        var inUsers = req.body;
        var encryptedPasswordsUsers = [];
        var errHandle = {error: false, errorMessage: ""};
        var year, semester, department, college;

        console.log(inUsers);

        handleErrors = function () {
            console.log("handle errors");
            console.log(errHandle);

            if (errHandle.error) {
                res.status(500).send(errHandle.errorMessage).end();
                return true;
            }
        };

        var usersPromises = req.body.map(function (user) {
            return new Promise(function (resolve, reject) {

                if (user.Email == "") {
                    console.log("Email filed is empty for user: " + user.Username);
                    errHandle = {error: true, errorMessage: "email field is empty"};
                    resolve();
                }
                else {
                    User.findOne({Username: user.Username}, function (err, user) {
                        if (err){
                            return reject(err);
                        }
                        if (user) {
                            console.log("Account with that user name already exists - " + user.Username);
                            errHandle = {
                                error: true,
                                errorMessage: {
                                    msg: "Account with that user name already exists.",
                                    Username: user.Username
                                }
                            };
                        }
                        resolve();
                    });
                }
            })
        });

        sendMail = function () {
            console.log("send mail");
            for (var i = 0; i < inUsers.length; i++) {
                var newPerson = new User(inUsers[i]);
                inUsers[i].Password = randomstring(10); // returns random password with length of 10 chars, for example: "El4OtlO5Ln"
                newPerson.Password = crypto.createHash('sha256').update(inUsers[i].Password).digest('hex');
                newPerson.Role = {"Name" : "סטודנט", "Slug" : "student"};
                newPerson.Year = year[0];
                newPerson.Department = department[0];
                newPerson.Semester = semester[0];
                newPerson.College = college[0];
                newPerson.gender = false;
                newPerson.inGroup = false;
                newPerson.inProcess = false;
                encryptedPasswordsUsers.push(newPerson);
            }

            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');

            User.insertMany(encryptedPasswordsUsers, function (err, mongooseDocuments) {

                console.log("encrypted ----> " + encryptedPasswordsUsers);
                console.log("mongoose doc ----> " + mongooseDocuments); //print all users -- for debug

                for (var i = 0, l = inUsers.length; i < l; i++) {
                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                        from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                        to: inUsers[i].Email, // list of receivers
                        subject: 'פרטי התחברות למערכת הפרויקטים SCE FPM', // Subject line
                        //text: 'Hello world 🐴', // plaintext body
                        html: '<html xmlns="http://www.w3.org/1999/xhtml" lang="he" dir="rtl">' +
                        '<head>' +
                        '<title>סמי שמעון - פרוייקטים הנדסיים</title>' +
                        '</head>' +
                        '<body bgcolor="#FFFFFF" style="text-align:right; direction:rtl;">' +
                        '<!-- BODY -->' +
                        '<table class="body-wrap">' +
                        '	<tr>' +
                        '		<td></td>' +
                        '		<td class="container" bgcolor="#FFFFFF">' +
                        '			<div class="content">' +
                        '			<table>' +
                        '				<tr>' +
                        '					<td>' +
                        '						' +
                        '						<h3>שלום, ' + inUsers[i].firstName + '</h3>' +
                        '						<p class="lead">פרטי ההתחברות למערכת הפרוייקטים הינם:</p>' +
                        '						<p class="lead">שם משתמש: ' + inUsers[i].Username + '</p>' +
                        '						<p class="lead">הסיסמא: ' + inUsers[i].Password + '</p>' +
                        '						<br/>' +
                        '						<br/>							' +
                        '												' +
                        '						<!-- social & contact -->' +
                        '						<table class="social" width="100%">' +
                        '							<tr>' +
                        '								<td>' +
                        '									' +
                        '									<!--- column 1 -->' +
                        '									<table align="left" class="column">' +
                        '										<tr>' +
                        '											<td>				' +
                        '												' +
                        '												' +
                        '												' +
                        '											</td>' +
                        '										</tr>' +
                        '									</table><!-- /column 1 -->	' +
                        '									' +
                        '									<!--- column 2 -->' +
                        '									<table align="left" class="column">' +
                        '										<tr>' +
                        '											<td>				' +
                        '																			' +
                        '												<h5 class="">SCE FPM צוות מערכת לניהול פרוייקטי גמר הנדסיים:</h5>												' +
                        '												<p>טלפון: <strong>08-6475804</strong><br/>' +
                        '                אי-מייל: <strong><a href="emailto:sce.fpm@gmail.com">sce.fpm@gmail.com</a></strong></p>' +
                        '                ' +
                        '											</td>' +
                        '										</tr>' +
                        '									</table><!-- /column 2 -->' +
                        '									' +
                        '									<span class="clear"></span>	' +
                        '									' +
                        '								</td>' +
                        '							</tr>' +
                        '						</table><!-- /social & contact -->' +
                        '					' +
                        '					' +
                        '					</td>' +
                        '				</tr>' +
                        '			</table>' +
                        '			</div>' +
                        '									' +
                        '		</td>' +
                        '		<td></td>' +
                        '	</tr>' +
                        '</table><!-- /BODY -->' +
                        '' +
                        '<!-- FOOTER -->' +
                        '<table class="footer-wrap">' +
                        '	<tr>' +
                        '		<td></td>' +
                        '		<td class="container">' +
                        '			' +
                        '				<!-- content -->' +
                        '				<div class="content">' +
                        '<table class="head-wrap" bgcolor="#999999">' +
                        '	<tr>' +
                        '		<td></td>' +
                        '		<td class="header container">' +
                        '			' +
                        '				<div class="content">' +
                        '					<table bgcolor="#999999">' +
                        '					<tr>' +
                        '						<td><img src="http://www.massage-b7.co.il/sce.png" /></td>' +
                        '						<td align="right"><h6 class="collapse"></h6></td>' +
                        '					</tr>' +
                        '				</table>' +
                        '				</div>' +
                        '				' +
                        '		</td>' +
                        '		<td></td>' +
                        '	</tr>' +
                        '</table>' +
                        '				</div><!-- /content -->' +
                        '				' +
                        '		</td>' +
                        '		<td></td>' +
                        '	</tr>' +
                        '</table><!-- /FOOTER -->' +


                        '</body>' +
                        '</html>'
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: ' + info.response);
                    });
                }

                res.status(200);
                res.end();
            });
        };

        pr = function(){
            Promise.all(usersPromises).then(function () {
                console.log("all users checked");
                if (!handleErrors()) {
                    sendMail();
                }
            });
        };

        Semester.find({Slug: inUsers[0].Semester},{_id:false}, function (err, semesters) {
            if (err){
                console.log("Error")}
            console.log("semester is------> " + semesters);
            semester = semesters;
        });

        College.find({Slug: inUsers[0].College},{_id:false}, function (err, colleges) {
            if (err){
                console.log("Error")}
            console.log("colleges is------> " + colleges);
            college = colleges;
        });

        Department.find({Name: inUsers[0].Department},{_id:false}, function (err, departments) {
            if (err){
                console.log("Error")}
            console.log("departments is------> " + departments);
            department = departments;
        });

        async.series([
            function(){
                Year.find({Name: inUsers[0].Year},{_id:false}, function (err, years) {
                    if (err){
                        console.log("Error")
                    }
                    console.log("year is------> " + years);
                    year = years;
                    pr();
                });
            }
        ]);
    },
    resetPasswordSuccessEmail: function (req, res) {
        async.waterfall([
            function (done) {
                User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: {$gt: Date.now()}
                }, function (err, user) {
                    if (!user) {
                        req.flash('error', 'פג תוקף לינק השחזור או שהלינק איננו תקין.');
                        return res.redirect('back');
                    }

                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    user.Password = crypto.createHash('sha256').update(req.body.password).digest('hex');

                    user.save(function (err, savedUser) {
                        res.status(200);
                        res.end();
                        var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');
                        var mailOptions = {
                            to: savedUser.Email,
                            from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                            subject: 'SCE שחזור סיסמא למערכת',
                            text: 'שלום,\n\n' +
                            'זהו מייל אישור, סיסמתך לחשבון ' + savedUser.Username + ' שונתה בהצלחה.\n'
                        };
                        transporter.sendMail(mailOptions, function (err, info) {
                            //req.flash('success', 'Success! Your password has been changed.');
                            if (err) {
                                return console.log(err);
                            }
                            console.log('Message sent: ' + info.response);
                            res.status(200).send();
                            res.end();

                        });
                    });
                });
            }
        ], function (err) {
            res.redirect('/');
        });
    },


    getUsersNotInProject: function (req, res) {

        if (req)
            if (req.params) {
                var projID = req.params.project;

                if (req.params.role)
                    if (req.params.role === 'lecturer') {

                        var userRole = req.params.role;

                        Project.find({_id: projID}, {"lecturers.id": true}).exec(function (err, usersInProject) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err)
                                return res.send(err);

                            var lecturersinProject = usersInProject[0].lecturers;

                            var usersIds = lecturersinProject.map(function (item) {
                                var ObjectId = mongoose.Types.ObjectId;
                                var result = new ObjectId(item.id);
                                return result
                            });

                            User.find({"_id": {$nin: usersIds}, "Role.Slug": userRole}, function (error, resUsers) {
                                if (error) {
                                    return error;
                                }
                                else {
                                    if (!resUsers) {
                                        return fn(error);
                                    }
                                    else {
                                        res.status(200);
                                        return res.json(resUsers);
                                    }
                                }
                            })
                        });
                    }
                    else if (req.params.role === 'student') {
                        var userRole = req.params.role;
                        Project.findOne({'_id': projID}, {
                            "students.id": true,
                            "flow": true
                        }).exec(function (err, usersInProject) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err)
                                return res.send(err);
                            if (usersInProject) {
                                if (usersInProject.students && usersInProject.students.count > 0) {
                                    var usersIProject = usersInProject.students;
                                    var projectCollege = usersInProject.flow.Department.Slug;
                                    var usersIds = usersIProject.map(function (item) {
                                        var ObjectId = mongoose.Types.ObjectId;
                                        var result = new ObjectId(item.id);
                                        return result
                                    });
                                    User.find({
                                        "_id": {$nin: usersIds},
                                        "Role.Slug": userRole,
                                        "College.Slug": projCollege,
                                        "Department.Slug": req.user.Department.Slug,
                                        "inGroup": "false"
                                    }, function (error, resUsers) {
                                        if (error) {
                                            return error;
                                        }
                                        else {
                                            if (!resUsers) {
                                                return fn(error);
                                            }
                                            else {
                                                res.status(200);
                                                res.json(resUsers);
                                            }
                                        }
                                    });
                                }
                                else {
                                    User.find({
                                        "Role.Slug": userRole,
                                        "College.Slug": usersInProject.flow.College.Slug,
                                        "Department.Slug": req.user.Department.Slug,
                                        "inGroup": "false"
                                    }, function (error, resUsers) {
                                        if (error) {
                                            return error;
                                        }
                                        else {
                                            if (!resUsers) {
                                                return fn(error);
                                            }
                                            else {
                                                res.status(200).send(resUsers);
                                                res.end();
                                            }
                                        }
                                    });
                                }
                            }

                        });
                    }
            }
    },


    getAll: function (req, res) {
        // use mongoose to get all users in the database
        User.find({}, function (err, users) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.status(400).send(err);
            res.status(200).send(users); // return all users in JSON format
        });
    },

    getSingle: function (req, res) {
        var id = req.params.userId;

        User.findOne({'_id': id}, function (err, user) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                return res.send(err);

            return res.json(user); // return user in JSON format
        });
    },
    getUsernames: function (req, res) {
        User.find({}, {Username: 1}, function (err, usernames) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                return res.send(err);

            var usernameStringArray = usernames.map(function (item) {
                return item.Username;
            });

            return res.json(usernameStringArray); // return user in JSON format
        });
    },

    resendPasswordToken: resendPasswordToken,


    getUsersByManager: function (req, res) {
        var userType = req.user.Role.Slug;
        if (userType === "manager")
        {
            User.find
            (
                {"Department.Slug": req.user.Department.Slug},
                function (err, projs) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err) {
                        res.send(err);
                        return;
                    }

                    res.json(projs); // return all projects in JSON format
                }
            );
        }
        else
            {
                User.find
                (

                    function (err, projs) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err) {
                            res.send(err);
                            return;
                        }

                        res.json(projs); // return all projects in JSON format
                    }
                );
            }

    },

    getFiltersByManager: function (req, res) {

        var inDepartment = req.user.Department.Slug;

        //lecturers
        User.find({
            $and: [{"Department.Slug": inDepartment}, {
                "Role.Slug": 'lecturer'
            }]
        }, function (err, resLecturers) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            var lecturers = resLecturers;

            //students
            User.find({
                $and: [{"Department.Slug": inDepartment}, {
                    "Role.Slug": 'student'
                }]
            }, function (err, resStudents) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                var students = resStudents;

                //stages
                Stage.find({
                    $and: [{"Department": inDepartment}]
                }, function (err, resStages) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err);

                    var stages = resStages;

                    //statuses
                    Status.find({
                        $and: [{"Department": inDepartment}]
                    }, function (err, resStatuses) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            res.send(err);

                        var statuses = resStatuses;

                        // use mongoose to get all users in the database
                        var inCollege = req.user.College.Slug;
                        var inDepartment = req.user.Department.Slug;

                        //flows
                        ProjectFlow.find
                        (
                            {"College.Slug": inCollege, "Department.Slug": inDepartment},
                            {'Type':1},
                            {},
                            function (err, deps) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err)
                                    res.send(err);

                                //res.json(deps); // return all departments in JSON format
                                var projectflows = deps;

                                //semesters
                                Semester.find({},{_id:false},function (err, semesters) {

                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err)
                                        res.send(err);

                                    //departments
                                    Department.find({},{_id:false},function (err, departments) {

                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                        if (err)
                                            res.send(err);

                                        //colleges
                                        College.find({},{_id:false},function (err, colleges) {

                                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                            if (err)
                                                res.send(err);

                                            //years
                                            Year.find({},{_id:false},function (err, years) {

                                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                                if (err)
                                                    res.send(err);

                                                var allFilters = {
                                                    lecturers: lecturers,
                                                    students: students,
                                                    stages: stages,
                                                    statuses: statuses,
                                                    projectflows: projectflows,
                                                    semesters: semesters,
                                                    pairedOpts: ["true", "false"],
                                                    approvalOpts: ["true", "false"],
                                                    departments: departments,
                                                    colleges: colleges,
                                                    years: years
                                                };

                                                res.status(200).send(allFilters);
                                            });
                                        });
                                    });
                                });
                            });
                    });
                });
            });
        });
    },

    getCurrentUser: function (req, res) {
        curUser = req.user;
        delete curUser.Password;
        delete curUser.Birthday;
        res.send(req.user); // return all projects in JSON format
    },
    getUsersReportsByManager: function (req, res) {
        var inManagerID = req.user._id;
        var inRole = req.params.role;
        var inReportType = req.params.reporttype;
        if (inReportType === 'ungroupped') {
            User.findOne({
                "_id": inManagerID,
            }, function (error, managerUser) {
                if (error) {
                    console.log('in user router error');
                    return error;
                }
                else {
                    if (!managerUser) {
                        console.log('in user router empty');
                        res.send(error)
                    }
                    else {
                        User.find
                        (
                            {
                                "Department.Slug": req.user.Department.Slug,
                                "Role.Slug": inRole,
                                "inGroup": false
                            },
                            function (err, projs) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err) {
                                    res.send(err);
                                    return;
                                }

                                res.json(projs); // return all projects in JSON format
                            }
                        );
                    }

                }
            });
        }
        else if (inReportType === 'unopened') {
            User.findOne({
                "_id": inManagerID,
            }, function (error, managerUser) {
                if (error) {
                    console.log('in user router error');
                    return error;
                }
                else {
                    if (!managerUser) {
                        console.log('in user router empty');
                        res.send(error)
                    }
                    else {
                        Project.aggregate([
                            {"$unwind": "$lecturers"},
                            {"$unwind": "$lecturers.id"},
                            {
                                "$project": {
                                    "id": 1

                                }
                            }
                        ], function (error, allProjects) {
                            User.find
                            (
                                {
                                    "Department.Slug": managerUser.Department.Slug,
                                    "Role.Slug": inRole,
                                    "_id": {$nin: allProjects}
                                },
                                function (err, lecturersFromDepartment) {
                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err) {
                                        res.send(err);
                                        return;
                                    }

                                    res.json(lecturersFromDepartment); // return all projects in JSON format

                                }
                            );
                        });


                    }

                }
            });
        }
    }


};
