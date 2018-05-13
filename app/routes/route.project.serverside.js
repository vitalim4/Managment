// load the needed models
var nodemailer = require('nodemailer');
var Project = require('../models/model.project.serverside');
var ProjectFlow = require('../models/model.projectflow.serverside');
var User = require('../models/model.user.serverside');
var Role = require('../models/model.role.serverside');
var ApproveRequest = require('../models/model.approve-request.serverside');
var Notification = require('../models/model.notification.serverside');
var mongoose = require('mongoose');                     // mongoose for mongodb


var nextStage = function (inProject) {
    var nextLevel = inProject.curState.curOrder + 1;
    if (inProject.flow.Stage.filter(function (e) {
            return e.Order == nextLevel;
        }).length > 0) {
        inProject.curState.curOrder = nextLevel;
        inProject.curState.curStage = inProject.flow.Stage[nextLevel].Name;
        inProject.curState.curStatus = inProject.flow.Stage[nextLevel].Status.Name;
    }
};

var nextStageWOpen = function (inProject) {
    var curLevel = inProject.curState.curOrder;
    var nextLevel = inProject.curState.curOrder + 1;
    if (inProject.flow.Stage.filter(function (e) {
            return e.Order == nextLevel;
        }).length > 0) {

        inProject.curState.curOrder = nextLevel;
        inProject.curState.curStage = inProject.flow.Stage[nextLevel].Name;
        inProject.curState.curStatus = inProject.flow.Stage[nextLevel].Status.Name;
        inProject.flow.Stage[nextLevel].Submission.Open = true;
        inProject.flow.Stage[curLevel].Submission.Open = false;
    }
    else console.log("nextStageWOpen errror");
};

//Moves to next stage which have some weight\percentage in flow
var nextStageWithWeight = function (inProject) {
    var curLevel = inProject.curState.curOrder;
    if (inProject.flow.Stage.filter(function (e) {
            return (e.Order > curLevel && e.percentInProject != 0);
        }).length > 0) {
        var nextLevel = curLevel + 1;
        inProject.curState.curOrder = nextLevel;
        inProject.curState.curStage = inProject.flow.Stage[nextLevel].Name;
        inProject.curState.curStatus = inProject.flow.Stage[nextLevel].Status.Name;
    }
};

var initialStageWithWeight = function (inProject) {
    var nextLevel = 0;
    inProject.curState.curOrder = nextLevel;
    inProject.curState.curStage = inProject.flow.Stage[nextLevel].Name;
    inProject.curState.curStatus = inProject.flow.Stage[nextLevel].Status.Name;
};

var PreviousStage = function (inProject) {
    var nextLevel = inProject.curState.curOrder - 1;
    if (inProject.flow.Stage.filter(function (e) {
            return e.Order == nextLevel;
        }).length > 0) {
        inProject.curState.curOrder = nextLevel;
        inProject.curState.curStage = inProject.flow.Stage[nextLevel].Name;
        inProject.curState.curStatus = inProject.flow.Stage[nextLevel].Status.Name;
    }

};

module.exports = {


    getAll: function (req, res) {
        Project.find(function (err, projects) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(projects); // return all projects in JSON format
        });
    },

    getSingle: function (req, res) {
        var projID = req.params.id;
        Project.findOne({_id: projID}, function (err, project) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                return res.send(err);

            res.json(project); // return single project in JSON format
        });
    },

    getByDepartment: function (req, res) {
        // use mongoose to get all users in the database
        var inDepartment = req.user.Department.Slug;
        var inCollege = req.user.College.Slug;
        var inSemester = req.user.Semester.Slug;
        var inYear = req.user.Year.Slug;

        Project.find
        (
            {"flow.Department.Slug": inDepartment, "flow.College.Slug": inCollege, "isPaired": false, "Year.Slug":inYear, "Semester.Slug":inSemester},
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                res.json(projs); // return all projects in JSON format
            }
        );
    },

    getProjectsByStudent: function (req, res) {
        var inUserID = req.user._id;
        Project.find
        (
            {"students.id": inUserID},
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err) {
                    res.send(err);
                    return;
                }

                res.json(projs); // return all projects in JSON format
            }
        );
    },

    getByLecturer: function (req, res) {
        var inLecturerID = req.user._id;
        Project.find
        (
            {"lecturers.id": inLecturerID},
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err) {
                    res.send(err);
                    return;
                }

                res.json(projs); // return all projects in JSON format
            }
        );
    },
    getArchivedProjectsByLecturer: function (req, res) {
        var inLecturerID = req.user._id;
        Project.find
        (
            { $and: [ { "lecturers.id": inLecturerID }, {"curState.curStage": "פרוייקט שהוצג ועבר בהצלחה"} ] } ,
            //{ "lecturers.id": inLecturerID },
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err) {
                    res.send(err);
                    return;
                }

                res.json(projs); // return all projects in JSON format
            }
        );
    },
    getAllArchivedProjects: function (req, res) {
        var inLecturerID = req.user._id;
        Project.find
        (
            {"curState.curStage": "פרוייקט שהוצג ועבר בהצלחה"},
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err) {
                    res.send(err);
                    return;
                }

                res.json(projs); // return all projects in JSON format
            }
        );
    },
    getActiveProjectsByLecturer:function(req,res){
        var inManagerID = req.user._id;
        var userType = req.user.Role.Slug;

        if (userType === "lecturer") {
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
                        return error;
                    }
                    else {

                        var userDep = managerUser.Department.Slug;
                        Project.find
                        (
                            //{"flow.Department.Slug": userDep},
                            { $and: [ { "lecturers.id": inManagerID }, {"flow.Department.Slug": userDep} ] },
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
        else{
            res.status(401);
            res.end();
        }
    },

    getProjectsByLecturer:function(req, res){

        var inManagerID = req.user._id;
        var userType = req.user.Role.Slug;

        if (userType === "lecturer") {
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
                        return error;
                    }
                    else {

                        var userDep = managerUser.Department.Slug;
                        Project.find
                        (
                            {"flow.Department.Slug": userDep},
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
        else{
            res.status(401);
            res.end();
        }
    },
    getProjectsByManager: function (req, res) {
        var inManagerID = req.user._id;
        var userType = req.user.Role.Slug;

        if (userType === "manager" || userType ==="admin") {
            if(userType ==="admin"){
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
                            return error;
                        }
                        else {
    
                            var userDep = managerUser.Department.Slug;
                            Project.find
                            (
                                //{"flow.Department.Slug": userDep},
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
            else if(userType === "manager"){
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
                            return error;
                        }
                        else {
    
                            var userDep = managerUser.Department.Slug;
                            Project.find
                            (
                                {"flow.Department.Slug": userDep},
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
        }
        else{
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
                        return error;
                    }
                    else {

                        Project.find
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

                }
            });
        }
    },
    deleteProjectByManager: function (req, res) {
        var inProjectId = req.params.projectId;
        if (inProjectId) {
            Project.findById
            (
                {"_id": inProjectId},
                function (err, deletedProject) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err)
                    if (deletedProject.students) {
                        var StudentsInProject = deletedProject.students;


                        var usersIds = StudentsInProject.map(function (item) {
                            var ObjectId = mongoose.Types.ObjectId;
                            var result = new ObjectId(item.id);
                            return result
                        });

                        //unset all flags for users
                        User.update({
                            "_id": {$in: usersIds}
                        }, {$set: {'inProcess': false, 'inGroup': false}}, function (error, resUsers) {
                            if (error) {
                                console.log('in user router error');
                                return error;
                            }
                            else {
                                if (!resUsers) {
                                    console.log('no users in deleted projects');
                                }

                                Project.remove({"_id": inProjectId}, function (err) {
                                    if (err) {
                                        return res.send(err)
                                    }
                                    ApproveRequest.remove({"projectId": inProjectId}, function (err) {
                                        if (err) {
                                            return res.send(err)
                                        }

                                        res.status(200);
                                        res.end();

                                    });
                                });
                            }
                        });
                    }
                });

        }
    },

    getRequestsByManager: function (req, res) {
        var user = req.user;
        if (user.Role.Slug === "manager") {     
            var approveReq = [];
            var cursor = ApproveRequest.aggregate(
                {
                    $project: {
                        projectId: 1,
                        lecturers: 1,
                        Department: 1,
                        Type: 1,
                        College: 1,
                        projectName: 1,
                        shortDescription: 1,
                        numOfStudents: 1,
                        creationDate: 1,
                        matches: {$eq: ['$creationDate', '$updateDate']}
                    }
                },
                {
                    $match: {
                        matches: true,
                        $and: [{"Department.Slug": user.Department.Slug}, {"College.Slug": user.College.Slug}]
                    }
                }
            ).cursor({ batchSize: 1000 }).exec();

            cursor.forEach(function(doc) {
                approveReq.push(doc);
              }, function (err) {
                if (err) return res.send(err);
                res.json(approveReq);
              });
        }
        else
            {    
                var approveReq = [];
                var cursor = ApproveRequest.aggregate(
                    {
                        $project: {
                            projectId: 1,
                            lecturers: 1,
                            Department: 1,
                            Type: 1,
                            College: 1,
                            projectName: 1,
                            shortDescription: 1,
                            numOfStudents: 1,
                            creationDate: 1,
                            matches: {$eq: ['$creationDate', '$updateDate']}
                        }
                    },
                    {
                        $match: {
                            matches: true,
                            $and: [{"College.Slug": user.College.Slug}]
                        }
                    }
                ).cursor({ batchSize: 1000 }).exec();
    
                cursor.forEach(function(doc) {
                    approveReq.push(doc);
                  }, function (err) {
                    if (err) return res.send(err);
                    res.json(approveReq);
                  });

            }
    },


    getRequestsArchiveByManager: function (req, res) {
        var inDepartment = req.user.Department.Slug;

        var inCollege = req.user.College.Slug;

        var userType = req.user.Role.Slug;
        if (userType === "manager") {
            var approveReq = [];
                var cursor = ApproveRequest.aggregate(
                    {
                        $project: {
                            projectId: 1,
                            lecturers: 1,
                            Department: 1,
                            Type: 1,
                            College: 1,
                            projectName: 1,
                            shortDescription: 1,
                            numOfStudents: 1,
                            creationDate: 1,
                            matches: {$ne: ['$creationDate', '$updateDate']}
                        }
                    },
                    {
                        $match: {
                            matches: true,
                            $and: [{"Department.Slug": inDepartment}, {"College.Slug": inCollege}]
                        }
                    }
                ).cursor({ batchSize: 1000 }).exec();
    
                cursor.forEach(function(doc) {
                    approveReq.push(doc);
                  }, function (err) {
                    if (err) return res.send(err);
                    res.json(approveReq);
                  });

        }
        else {
            var approveReq = [];
            var cursor = ApproveRequest.aggregate(
               { $project: {
                    projectId: 1,
                    lecturers: 1,
                    Department: 1,
                    Type: 1,
                    College: 1,
                    projectName: 1,
                    shortDescription: 1,
                    numOfStudents: 1,
                    creationDate: 1,
                    matches: {$ne: ['$creationDate', '$updateDate']}
                }
            }
            ).cursor({ batchSize: 1000 }).exec();

            cursor.forEach(function(doc) {
                approveReq.push(doc);
              }, function (err) {
                if (err) return res.send(err);
                res.json(approveReq);
              });
        }
    },

    getRoles: function (req, res) {
        console.log("123");


    },


    /*getRoles: function (req, res) {
     // use mongoose to get all roles in the database

     x = 0;

     console.log("123");

     Role.find({},
     function (err, roles) {
     // if there is an error retrieving, send the error. nothing after res.send(err) will execute
     if (err)
     return res.send(err)

     returnres.json(roles); // return all departments in JSON format
     }
     );
     },*/

    getRequestById: function (req, res) {
        var inRequestId = req.params.requestId;
        if (inRequestId)
            ApproveRequest.findOne
            (
                {_id: inRequestId},
                function (err, request) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err)

                    res.json(request); // return all projects in JSON format
                }
            );
    },

    getNotifications: function (req, res) {
        var inProject = req.params.projectid;

        Notification.find({"projectId": inProject}, function (err, projectsNotificiations) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.status(200);
            var s = JSON.stringify(projectsNotificiations);
            res.end(s);

        });
    },


    submitGrade: function (req, res) {
        var inGrade = req.body.grade;
        var inReason = req.body.reason;
        var inProjId = req.body.projId;
        var inLecId = req.body.lecturerId;
        Project.findById
        (
            {"_id": inProjId},
            function (err, updatedProject) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                updatedProject.flow.Stage[updatedProject.curState.curOrder].Submission.GradeDate = new Date();
                updatedProject.flow.Stage[updatedProject.curState.curOrder].Submission.Grade = inGrade;
                updatedProject.flow.Stage[updatedProject.curState.curOrder].Submission.LecturerComments = inReason;
                updatedProject.flow.Stage[updatedProject.curState.curOrder].Submission.LecturerId = inLecId;

                nextStageWOpen(updatedProject);

                updatedProject.save(function (err, savedProject) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    res.status(200);
                    var s = JSON.stringify(savedProject);
                    res.end(s);
                });
            });
    },


    sendApprovalRequest: function (req, res) {
        var inProject = req.params.project;
        Project.findById
        (
            {"_id": inProject},
            function (err, projectForApproval) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                var newRequest = new ApproveRequest();
                newRequest.projectId = projectForApproval._id;
                newRequest.projectName = projectForApproval.nameHeb;
                newRequest.shortDescription = projectForApproval.shortDescription;
                newRequest.lecturers = projectForApproval.lecturers;
                newRequest.numOfStudents = projectForApproval.students.length;
                newRequest.isApproved = false;
                newRequest.reason = "";
                newRequest.Department = projectForApproval.flow.Department;
                newRequest.College = projectForApproval.flow.College;
                newRequest.Type = projectForApproval.flow.Type;
                newRequest.creationDate = newRequest.updateDate = new Date();

                newRequest.save(function (err, savedRequest) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    nextStage(projectForApproval);
                    projectForApproval.waitingApproval = true;
                    projectForApproval.save(function (err, savedProj) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);
                        res.status(200);
                        var s = JSON.stringify(savedProj);
                        res.end(s);
                    });


                });
            }
        );
    },

    rejectApprovalRequest: function (req, res) {
        var inRequest = req.params.requestid;
        var inRejectionContent = req.body.rejectContent;

        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');

        ApproveRequest.findById
        (
            {"_id": inRequest},
            function (err, approveRequest) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                if (approveRequest) {
                    approveRequest.reason = inRejectionContent;
                    approveRequest.updateDate = new Date();
                    approveRequest.save(function (err, savedRequest) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);


                        Project.findOne
                        ({_id: savedRequest.projectId},
                            function (err, reqProject) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err)
                                    res.send(err)
                                if (reqProject)
                                    reqProject.waitingApproval = false;
                                PreviousStage(reqProject);

                                reqProject.save(function (err, savedProj) {

                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err)
                                        return res.send(err);

                                    if (savedProj.lecturers != null) {
                                        var lecturersinProject = savedProj.lecturers;

                                        var usersIds = lecturersinProject.map(function (item) {
                                            var ObjectId = mongoose.Types.ObjectId;
                                            var result = new ObjectId(item.id);
                                            return result
                                        });

                                        var studentEmails = savedProj.students.map(function (item) {
                                            return item.email
                                        });

                                        User.find({
                                            "_id": {$in: usersIds},
                                            "Role.Slug": 'lecturer'
                                        }, function (error, resUsers) {

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
                                                    for (var i = 0, l = resUsers.length; i < l; i++) {

                                                        // setup e-mail data with unicode symbols
                                                        var mailOptions = {
                                                            from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                                                            to: resUsers[i].Email, // list of receivers
                                                            subject: 'דחיית פרוייקט ' + reqProject.nameHeb, // Subject line
                                                            //text: 'Hello world 🐴', // plaintext body
                                                            html: '<html xmlns="http://www.w3.org/1999/xhtml" lang="he" dir="rtl">' +
                                                            '<head>' +
                                                            '<title>סמי שמעון - פרוייקטים הנדסיים' + reqProject.nameHeb + '</title>' +
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
                                                            '						<h3>שלום, ' + resUsers[i].firstName + '</h3>' +
                                                            '						<p class="lead">הפרוייקט ' + reqProject.nameHeb + ' נדחה על ידי מנהל הפרוייקטים </p>' +
                                                            '						<p class="lead">הסיבה: ' + inRejectionContent +
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
                                                            '												<p>טלפון: <strong>050-5822445</strong><br/>' +
                                                            '                אי-מייל: <strong><a href="emailto:ronenmars@gmail.com">ronenmars@gmail.com</a></strong></p>' +
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

                                                    // setup e-mail data with unicode symbols
                                                    var mailOptions = {
                                                        from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                                                        to: studentEmails, // list of receivers
                                                        subject: 'דחיית פרויקט ' + reqProject.nameHeb, // Subject line
                                                        html: '<html xmlns="http://www.w3.org/1999/xhtml" lang="he" dir="rtl">' +
                                                        '<head>' +
                                                        '<title>סמי שמעון - פרוייקטים הנדסיים' + reqProject.nameHeb + '</title>' +
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
                                                        '						<h3>שלום,</h3>' +
                                                        '						<p class="lead">הפרוייקט ' + reqProject.nameHeb + ' נדחה על ידי מנהל הפרוייקטים </p>' +
                                                        '						<p class="lead">הסיבה: ' + inRejectionContent +
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
                                                        '												<p>טלפון: <strong>050-5822445</strong><br/>' +
                                                        '                אי-מייל: <strong><a href="emailto:ronenmars@gmail.com">ronenmars@gmail.com</a></strong></p>' +
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

                                                    res.status(200);
                                                    var s = JSON.stringify(savedRequest);
                                                    res.end(s);
                                                }
                                            }

                                        });
                                    }

                                });

                            });

                    });
                }
            }
        );
    },

    updateProjectsStatus:function(req,res)
    {
        var projId = req.params.requestid;
        Project.findById(
            {"_id": projId},
            function (err, updatedProject) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                nextStageWOpen(updatedProject); 
                /*res.send(updatedProject);*/
                updatedProject.save(function (err, updatedProject2) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    var StudentsInProject = updatedProject2.students;

                    var usersIds = StudentsInProject.map(function (item) {
                        var ObjectId = mongoose.Types.ObjectId;
                        var result = new ObjectId(item.id);
                        return result
                    });


                    User.update({
                        "_id": {$in: usersIds}
                    }, {$set: {'inProcess': true}}, function (error, resUsers) {
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

                                updatedProject2.save(function (err, savedProject) {
                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                        if (err)
                                            return res.send(err);

                                        res.status(200);
                                        var s = JSON.stringify(savedProject);
                                        res.end(s);
                                    }
                                );

                            }
                        }
                    });
                });


            });
    },

    uncheckProjectsStatus:function(req,res)
    {
        var projId = req.params.requestid;
        Project.findById(
            {"_id": projId},
            function (err, updatedProject) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                    PreviousStage(updatedProject); 
                res.send(updatedProject);
                updatedProject.save(function (err, updatedProject2) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    var StudentsInProject = updatedProject2.students;

                    var usersIds = StudentsInProject.map(function (item) {
                        var ObjectId = mongoose.Types.ObjectId;
                        var result = new ObjectId(item.id);
                        return result
                    });


                    User.update({
                        "_id": {$in: usersIds}
                    }, {$set: {'inProcess': true}}, function (error, resUsers) {
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

                                updatedProject2.save(function (err, savedProject) {
                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                        if (err)
                                            return res.send(err);

                                        res.status(200);
                                        var s = JSON.stringify(savedProject);
                                        res.end(s);
                                    }
                                );

                            }
                        }
                    });
                });


            });
    },

    acceptApprovalRequest: function (req, res) {
        var inRequest = req.params.requestid;

        ApproveRequest.findById
        (
            {"_id": inRequest},
            function (err, approveRequest) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                approveRequest.isApproved = true;
                approveRequest.updateDate = new Date;
                approveRequest.save(function (err, savedRequest) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);

                        Project.findById(
                            {"_id": approveRequest.projectId},
                            function (err, approvedProject) {
                                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                if (err)
                                    res.send(err);

                                approvedProject.isInProcess = true;
                                nextStageWOpen(approvedProject);
                                approvedProject.save(function (err, approvedProject2) {
                                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                    if (err)
                                        return res.send(err);

                                    var StudentsInProject = approvedProject2.students;

                                    var usersIds = StudentsInProject.map(function (item) {
                                        var ObjectId = mongoose.Types.ObjectId;
                                        var result = new ObjectId(item.id);
                                        return result
                                    });


                                    User.update({
                                        "_id": {$in: usersIds}
                                    }, {$set: {'inProcess': true}}, function (error, resUsers) {
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

                                                approvedProject2.save(function (err, savedProject) {
                                                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                                                        if (err)
                                                            return res.send(err);

                                                        res.status(200);
                                                        var s = JSON.stringify(savedProject);
                                                        res.end(s);
                                                    }
                                                );

                                            }
                                        }
                                    });
                                });


                            });
                    }
                );
            }
        )
    },

    sendCommentToLecturers: function (req, res) {
        var inRequest = req.params.requestid;
        var inComment = req.body.commentTxt;

        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport('smtps://sce.fpm@gmail.com:sce!131242@smtp.gmail.com');

        ApproveRequest.findById
        (
            {"_id": inRequest},
            function (err, approveRequest) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                approveRequest.updateDate = new Date;
                approveRequest.save(function (err, savedRequest) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);
                    Project.findById(
                        {"_id": approveRequest.projectId},
                        function (err, curProject) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err)
                                res.send(err);


                            var lecturersinProject = curProject.lecturers;

                            var usersIds = lecturersinProject.map(function (item) {
                                var ObjectId = mongoose.Types.ObjectId;
                                var result = new ObjectId(item.id);
                                return result
                            });

                            User.find({
                                "_id": {$in: usersIds},
                                "Role.Slug": 'lecturer'
                            }, function (error, resUsers) {

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
                                        for (var i = 0, l = resUsers.length; i < l; i++) {

                                            // setup e-mail data with unicode symbols
                                            var mailOptions = {
                                                from: '"SCE ניהול פרוייקטים הנדסיים" <sce.fpm@gmail.com>', // sender address
                                                to: resUsers[i].Email, // list of receivers
                                                subject: 'הערה אודות הפרוייקט ' + curProject.nameHeb, // Subject line
                                                //text: 'Hello world 🐴', // plaintext body
                                                html: '<html xmlns="http://www.w3.org/1999/xhtml" lang="he" dir="rtl">' +
                                                '<head>' +
                                                '<title>סמי שמעון - פרוייקטים הנדסיים' + curProject.nameHeb + '</title>' +
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
                                                '						<h3>שלום, ' + resUsers[i].firstName + '</h3>' +
                                                '						<p class="lead">הפרוייקט ' + curProject.nameHeb + ' קיבל הערה על ידי מנהל הפרוייקטים </p>' +
                                                '						<p class="lead">ההערה: ' + inComment +
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
                                                '												<p>טלפון: <strong>050-5822445</strong><br/>' +
                                                '                אי-מייל: <strong><a href="emailto:ronenmars@gmail.com">ronenmars@gmail.com</a></strong></p>' +
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
                                        res.send();
                                    }
                                }
                            });

                        });
                });
            });

    },

    getByEngName: function (req, res) {
        var inEnglishName = req.params.projengname;
        Project.find
        (
            {"nameEng": inEnglishName},
            function (err, projs) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                res.json(projs); // return all projects in JSON format
            }
        );
    }

    ,

    getByStudentId: function (req, res) {
        var inStudentId = req.params.student;


        Project.findOne
        (
            {"students.id": inStudentId},
            function (err, proj) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                res.json(proj); // return all projects in JSON format
            }
        );
    }
    ,

    filterProjects: function (req, res) {
        var filtersData = req.body.filters;
        var inGroup = req.body.inGroup;
        var inDepartment = req.body.inDepartment;


        Project.find({
            "lecturers": {$elemMatch: { id: {$in: filtersData} }},
            "isPaired": inGroup,
            "flow.Department.Name": inDepartment
        }, function (err, projects) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
            res.json(projects); // return all projects in JSON format
        });

    }
    ,
    advancedFilterProjects: function (req, res) {
        var filtersData = req.body.filters;
        var lecturers1 = [];
        if (filtersData.lecturers != 0 && filtersData.lecturers.length != 0) {
            var x = filtersData.lecturers;
            lecturers1 = x.map(function (item) {
                return item._id;
            });
        }
        var tags1 = [];
        if (filtersData.tags && filtersData.tags.length != 0)
            tags1 = filtersData.tags.map(function (item) {
                return item._id;
            });
        var inGroup = filtersData.inGroup;

        var types1 = [];
        if (filtersData.types && filtersData.types.length != 0)
            types1 = filtersData.types.map(function (item) {
                return item._id;
            });
        var statuses1 = [];
        if (filtersData.statuses && filtersData.statuses.length != 0)
            statuses1 = filtersData.statuses.map(function (item) {
                return item._id;
            });
        var stages1 = [];
        if (filtersData.stages && filtersData.stages.length != 0)
            stages1 = filtersData.stages.map(function (item) {
                return item._id;
            });

        Project.find({"$and": [{"$or": [{'lecturers.id': {$in: lecturers1}}, {'tags.text': {$in: tags1}}, {'curState.curStatus': {$in: statuses1}}, {'curState.curStage': {$in: stages1}}, {'Type.Name': {$in: types1}}]}, {"isPaired": inGroup}]}, function (err, projects) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
            res.json(projects); // return all projects in JSON format
        });

    }
    ,

    addStudent: function (req, res) {
        var projID = req.body.projectId;
        var newStudent = req.body.addedStudent;
        var isPaired = req.body.isPaired;
        var LevelUp = req.body.LevelUp;
        console.log(projID);

        Project.findOneAndUpdate(
            {_id: projID},
            {
                $push: {
                    'students': newStudent
                },
                $set: {
                    'isPaired': isPaired
                }
            },
            {upsert: true},
            function (err, updatedProject) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    return err;

                User.findOneAndUpdate(
                    {_id: newStudent.id},
                    {
                        $set: {inGroup: true}
                    },
                    {
                        upsert: true
                    }, function (err, res11) {

                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return err;
                        if (LevelUp) {
                            Project.findOne({_id: projID}, function (err, updatedProject) {
                                console.log(updatedProject);

                                nextStageWithWeight(updatedProject);

                                updatedProject.save(function (err) {
                                    if (err) throw err;
                                    sendBack();
                                });
                            });
                        }
                        else {
                            sendBack();
                        }
                    }
                );

            });


        var sendBack = function () {
            res.status(200);
            res.send();
        }
    }
    ,

    removeStudent: function (req, res) {
        var projID = req.body.projectId;
        var removedStudent = req.body.removedStudent;
        var removedStudentList = req.body.removedStudentList;
        var projectStatus = req.body.projectStatus;
        var emptyProj = req.body.emptyProj;

        Project.findOneAndUpdate(
            {_id: projID},
            {
                $set: {
                    'isPaired': projectStatus,
                    'students': removedStudentList
                }
            },
            {upsert: true},
            function (err, updatedt1) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    return err;

                User.findOneAndUpdate(
                    {_id: removedStudent.id},
                    {
                        $set: {inGroup: false}
                    },
                    {
                        upsert: true
                    }, function (err, res11) {

                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return err;
                        if (emptyProj) {
                            savesendBack(projID);
                        }
                        else {
                            sendBack(updatedt1);

                        }
                    }
                );

            });


        var sendBack = function (updatedProject) {
            res.json(updatedProject.students); // return all project students in JSON format

            res.status(200);
            res.send();
        }

        var savesendBack = function (projectWithInitState) {
            console.log("removed1 " + projectWithInitState)
            Project.findOne({_id: projectWithInitState}, function (err, updProject) {
                console.log("removed " + updProject._id);
                initialStageWithWeight(updProject);
                updProject.save(function (err) {
                    if (err) throw err;
                    sendBack(updProject);
                });

            });
        }
    }
    ,


    getAllTagsWWeight: function (req, res) {
        var inDepartment = req.user.Department.Slug;

        var approveReq = [];
        var cursor = Project.aggregate(
            [
                {"$project": {"tags": 1}},
                {"$unwind": "$tags"},
                {"$group": {"_id": "$tags.text", "weight": {"$sum": 1}}}
            ]
        ).cursor({ batchSize: 1000 }).exec();

        cursor.forEach(function(doc) {
            approveReq.push(doc);
          }, function (err) {
            if (err) return res.send(err);
            res.json(approveReq);
          });
    }
    ,

    getAllStages: function (req, res) {
        var inDepartment = req.user.Department.Slug;

        var inCollege = req.user.College.Slug;
        var approveReq = [];
        var cursor = ProjectFlow.aggregate(
            [
                {$match: {$and: [{"Department.Slug": inDepartment}, {"College.Slug": inCollege}]}},
                {"$project": {"Stage": 1}},
                {"$unwind": "$Stage"},
                {"$group": {"_id": "$Stage.Name"}}
            ]
        ).cursor({ batchSize: 1000 }).exec();

        cursor.forEach(function(doc) {    
            approveReq.push(doc);
          }, function (err) {
            if (err) return res.send(err);
            res.json(approveReq);
          });
    }
    ,

    getAllStatuses: function (req, res) {
        var inDepartment = req.user.Department.Slug;

        var inCollege = req.user.College.Slug;

        /*ProjectFlow.aggregate([
            {$match: {$and: [{"Department.Slug": inDepartment}, {"College.Slug": inCollege}]}},
            {"$project": {"Stage.Status": 1}},
            {"$unwind": "$Stage"},
            {"$group": {"_id": "$Stage.Status.Name"}}
        ], function (err, stages) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(stages);
        });*/

        var cursor = ProjectFlow.aggregate(
            [
                {$match: {$and: [{"Department.Slug": inDepartment}, {"College.Slug": inCollege}]}},
                {"$project": {"Stage.Status": 1}},
                {"$unwind": "$Stage"},
                {"$group": {"_id": "$Stage.Status.Name"}}
            ]
        ).cursor({ batchSize: 1000 }).exec();

        cursor.forEach(function(doc) {
            approveReq.push(doc);
          }, function (err) {
            if (err) return res.send(err);
            res.json(approveReq);
          });

    }
    ,


    getAllTagsTextByDepartment: function (req, res) {
        var inDepartment = req.user.Department.Slug;

        /*Project.aggregate([
            {"$project": {"tags": 1}},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags.text"}}
        ], function (err, tags) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(tags);
        });*/

        var department = [];
        var cursor = Project.aggregate([
            {"$project": {"tags": 1}},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags.text"}}
        ]).cursor({ batchSize: 1000 }).exec();

        cursor.forEach(function(doc) {
            department.push(doc);
          }, function (err) {
            if (err) return res.send(err);
            res.json(department);
          });

    }
    ,

    save: function (req, res) {

        if (req.body) {
            var inProject = new Project(req.body);
            if (req.body._id != null) {
                var lastModifiedX = new Date();
                var projID = inProject._id;
                Project.findOneAndUpdate(
                    {_id: projID},
                    {
                        $set: {
                            'nameHeb': inProject.nameHeb,
                            'nameEng': inProject.nameEng,
                            'flow': inProject.flow,
                            'projDescrip': inProject.projDescrip,
                            'shortDescription': inProject.shortDescription,
                            'neededKnowledge': inProject.neededKnowledge,
                            'picUrl': inProject.picUrl,
                            'isInProcess': inProject.isInProcess,
                            'isPaired': inProject.isPaired,
                            'waitingApproval': inProject.waitingApproval,
                            'professionalGuide': inProject.professionalGuide,
                            'tags': inProject.tags,
                            'literatureSources': inProject.literatureSources,
                            'lecturers': inProject.lecturers,
                            'students': inProject.students,
                            'createdDate': inProject.createdDate,
                            'lastModified': lastModifiedX,
                            'Year': inProject.Year,
                            'Semester': inProject.Semester
                        }
                    },
                    {upsert: true},
                    function (err, projectUpdated) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);

                        res.status(200);
                        res.send(projectUpdated);
                    });


            }
            else {
                inProject.isPaired = 0;
                inProject.waitingApproval = 0;
                inProject.isInProcess = 0;
                inProject.createdDate = new Date();
                inProject.lastModified = new Date();

                inProject.save(function (err, savedProject) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    res.status(200);

                    var s = JSON.stringify(savedProject);
                    res.end(s);
                });
            }
        }
    },
    uploadDocPdf:function(req, res){

        var projId = req.params.projId;
        var docName = req.params.doc;
        Project.findOneAndUpdate(
                {_id:projId},
                {
                    $set: {'Documentation':docName}
                },
                {
                    upsert: false
                },
                function (err, projectUpdated) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    res.status(200);
                    res.send(projectUpdated);
                });
    },

    save_end_proj: function (req, res) {

        if (req.body) {
            var inProject = new Project(req.body);
            inProject.curState.curStatus = 'פרוייקט גמור';
            inProject.curState.curStage = 'פרוייקט שהוצג ועבר בהצלחה';
            inProject.curState.curOrder = '10';
            console.log(inProject.curState);
            if (req.body._id != null) {
                var lastModifiedX = new Date();

                var projID = inProject._id;
                Project.findOneAndUpdate(
                    {_id: projID},
                    {
                        $set: {
                            'nameHeb': inProject.nameHeb,
                            'nameEng': inProject.nameEng,
                            'flow': inProject.flow,
                            'projDescrip': inProject.projDescrip,
                            'shortDescription': inProject.shortDescription,
                            'neededKnowledge': inProject.neededKnowledge,
                            'picUrl': inProject.picUrl,
                            'isInProcess': false,
                            'isPaired': inProject.isPaired,
                            'waitingApproval': inProject.waitingApproval,
                            'professionalGuide': inProject.professionalGuide,
                            'tags': inProject.tags,
                            'literatureSources': inProject.literatureSources,
                            'lecturers': inProject.lecturers,
                            'curState': inProject.curState,
                            'students': inProject.students,
                            'createdDate': inProject.createdDate,
                            'lastModified': lastModifiedX,
                            'Year': inProject.Year,
                            'Semester': inProject.Semester
                        }
                    },
                    {upsert: true},
                    function (err, projectUpdated) {
                        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                        if (err)
                            return res.send(err);

                        res.status(200);
                        res.send(projectUpdated);
                    });


            }
            else {
                inProject.isPaired = 0;
                inProject.waitingApproval = 0;
                inProject.isInProcess = 0;
                inProject.createdDate = new Date();
                inProject.lastModified = new Date();

                inProject.save(function (err, savedProject) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    res.status(200);

                    var s = JSON.stringify(savedProject);
                    res.end(s);
                });
            }
        }
    }
    ,


    AddSubmission: function (req, res) {
        var inProj = req.body.project;

        Project.findOneAndUpdate(
            {_id: inProj._id},
            {
                $set: {
                    'flow': inProj.flow
                }
            },
            {upsert: true},
            function (err, projectUpdated) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    return res.send(err);


                var lecturers = [];
                if (projectUpdated.lecturers != 0 && projectUpdated.lecturers.length != 0)
                    lecturers = projectUpdated.lecturers.map(function (item) {
                        return item._id;
                    });

                var lecturerNotification = new Notification();
                lecturerNotification.projectId = inProj._id;
                lecturerNotification.userId = lecturers;
                lecturerNotification.title = " הוגש\\ה" + inProj.curState.curStage;
                lecturerNotification.text = "הוגשה מטלה חדשה";
                lecturerNotification.updateDate = new Date();

                lecturerNotification.save(function (err, savedNotification) {
                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        return res.send(err);

                    res.status(200);

                    res.end();


                });
            });

    }


};