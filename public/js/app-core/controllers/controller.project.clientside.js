angular.module("FPM").controller('projectController', function ($scope, $http, $location, $window, $rootScope, Projects, localStorageService, $routeParams, $filter, Upload, $timeout, globalSettings) {


    //check user permissions
    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.onFocus = function (e) {
        $timeout(function () {
            $(e.target).trigger('input');
            $(e.target).trigger('change'); // for IE
        });
    };


    $scope.lecturers = [];
    $scope.selectedLecturer = [];
    $scope.selectedStudent1 = "";
    $scope.colleges = [];
    $scope.myFiles = [];
    $scope.curFlow = [];
    $scope.ApprovalSend = false;
    $scope.nostudents = false;

    /******************************************************************/
    /************************On Page Load******************************/
    /******************************************************************/
    /*
     * Local variables
     */
    $scope.projectData = {};
    $scope.newProject = {};
    $scope.projectData.lecturers = [];
    $scope.projectData.literatureSources = [];
    $scope.types = [];


    $scope.selectedLecturer = [];
    $scope.colleges = [];
    $scope.notifications = [];
    $scope.types = [];
    $scope.myFiles = [];
    $scope.curFlow = [];
    $scope.isPreview = true;
    $scope.lecturers = {};
    $scope.students = {};
    $scope.curFile = {};

    var initProcess = false;

    $scope.projectData._id = $routeParams.projectId;


    /*
     * User details from session in order to use them in server queries
     */
    var curUserDepartment = localStorageService.get('userDepartmentSlug');
    var curProjectID = $routeParams.projectId;


    /*
     * User details from session in order to use them in server queries
     */

    var curUserCollege = localStorageService.get('userCollege');

    $scope.data = { currentCollege: curUserCollege};


    $scope.submFile = function () { //function to call on form submit
        if ($scope.curFile.$error != "pattern") {
            $scope.upload($scope.curFile); //call upload function
        }
    };

    $scope.upload = function (file) {

        Upload.upload({
            url: '/upload', //webAPI exposed to upload the file
            data: {file: file} //pass file as data, should be user ng-model
        }).then(function (resp) { //upload function returns a promise
            if (resp.data.error_code === 0) { //validate success
                var filePath = resp.data.data;
                filePath = filePath.replace('C:\\Users\\Administrator\\WebstormProjects\\FPM-AngularJS\\public\\', '');
                console.log(filePath);
                $scope.projectData.picUrl = filePath;
                $scope.isPreview = false;

                toastr.success("התמונה עלתה בהצלחה", globalSettings.toastrOpts);

            } else {
                $window.alert('an error occured');
            }
        }, function (resp) { //catch error
            console.log('Error status: ' + resp.status);
            //$window.alert('Error status: ' + resp.status);
        }, function (evt) {
            console.log(evt);
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            progress = 'העלאה: ' + progressPercentage + '% '; // capture upload progress
        });
    };


    /*
     * Loading all exsisting colleges to form
     */
    $http({
        method: 'GET',
        url: '/api/projectsflow/colleges/'
    }).success(function (result) {
        $scope.colleges = result;
    });
    /*
     * Loading all existing semesters to form to form
     */
    $http({
        method: 'GET',
        url: '/api/semesters'
    }).success(function (result) {
        $scope.semesters = result;
    });
    /*
     * Loading all existing years to form to form
     */
    $http({
        method: 'GET',
        url: '/api/years'
    }).success(function (result) {
        $scope.years = result;
    });

    /*
     * Project data loading into a local object
     * Also we loading project types out of another
     * collection in case we will need to change projects type.
     * */
    if ($scope.projectData._id != null && angular.isDefined($scope.projectData._id)) {

        Projects.getSingle($scope.projectData._id)
            .success(function (projData) {

                initProcess = true;
                $scope.projectData = projData;
                $scope.data.currentType = $scope.projectData.flow.Type.Slug;
                $scope.data.currentTypeName = $scope.projectData.flow.Type.Name;
                $scope.data.currentCollege = $scope.projectData.flow.College.Slug;
                $scope.projectData.Semester = $scope.semesters.filter(function (semester) {
                    return semester.Name == projData.Semester.Name;
                })[0];
                $scope.projectData.Year = $scope.years.filter(function (year) {
                    return year.Name == projData.Year.Name;
                })[0];

                $scope.PageMode = 'edit';
                if (projData.picUrl != "")
                    $scope.isPreview = false;


                var typesURL = '/api/projectsflow/colleges/filter';
                $http(
                    {
                        method: 'GET',
                        url: typesURL
                    }
                ).success(
                    function (resTypes) {
                        /* Types Loading out of server */
                        $scope.types = resTypes;
                        initProcess = false;

                    }, true
                );


            });


        /*
         * Get lecturers in order to add to project.
         * Loading only lecturers who wasn't added to current project.
         * If new project - loading all lecturers.
         */
        $http({
            method: 'GET',
            url: '/api/users/not-in-project/lecturer/' + curUserCollege + '/' + curProjectID,
        }).then(function (result) {
            $scope.lecturers = result.data;
        });


        /*
         * Get students in order to add to project.
         * Loading only students who wasn't added to current project.
         * If new project - loading all students.
         */
        $http({
            method: 'GET',
            url: '/api/users/not-in-project/student/' + curUserCollege + '/' + curProjectID,
        }).then(function (result) {
            $scope.students = result.data;
        });


    }
    else {
        /*
         * Get lecturers in order to add to project.
         * Loading only lecturers who wasn't added to current project.
         * If new project - loading all lecturers.
         */
        $http({
            method: 'GET',
            url: 'api/users/for-project/lecturer'
        }).success(function (result) {
            $scope.lecturers = result;

            $http({
                method: 'GET',
                url: 'api/user/get-current'
            }).success(function (resultUser) {

                /*
                 * Adding lecturer who opened the page to project
                 */
                var addedLecturer = {
                    id: resultUser._id,
                    name: resultUser.firstName + ' ' + resultUser.lastName,
                    email: resultUser.Email
                };

                /*
                 Adding default lecturer
                 */
                if (typeof addedLecturer.id != 'undefined') {
                    $scope.projectData.lecturers.push(addedLecturer);

                    var addedLec = $filter('filter')($scope.lecturers, {_id: addedLecturer.id})[0];

                    $scope.lecturers.splice($scope.lecturers.indexOf(addedLec), 1);
                }
            });

        });


        /*
         * Get students in order to add to project.
         * Loading only students who wasn't added to current project.
         * If new project - loading all students.
         */

        /*
         * Get students in order to add to project.
         * Loading only students who wasn't added to current project.
         * If new project - loading all students.
         */
        $http({
            method: 'GET',
            url: '/api/users/not-in-project/student/' + curUserCollege + '/' + curProjectID,
        }).then(function (result) {
            $scope.students = result.data;
        });
    }


    /******************************************************************/
    /***********************Watchers***********************************/
    /******************************************************************/

    /*
     * College watcher - in case we will need to change project's college
     * If so, we need to load that college project types.
     */
    $scope.$watch('data.currentCollege', function (newValue) {
            if (typeof newValue != 'undefined' && typeof $scope.data != 'undefiend') {
                if ($scope.data.currentCollege != -1) {
                    var typesURL = '/api/projectsflow/colleges/filter';
                    $http(
                        {
                            method: 'GET',
                            url: typesURL
                        }
                    ).success(
                        function (resTypes) {
                            $scope.types = resTypes
                            $scope.data.currentType = resTypes[0].Type.Slug
                        }, true
                    )
                }
            }

        }
        , true);

    var collegeChange = function () {
        if (typeof $scope.data != 'undefiend') {
            if ($scope.data.currentCollege != -1) {
                var typesURL = '/api/projectsflow/colleges/filter';
                $http(
                    {
                        method: 'GET',
                        url: typesURL
                    }
                ).success(
                    function (resTypes) {
                        $scope.types = resTypes
                        $scope.data.currentType = resTypes[0].Type.Slug
                    }, true
                )
            }
        }
    };

    var typeChange = function () {
        if (!initProcess)
            if ($scope.data.currentCollege != -1 && $scope.data.currentType != -1) {
                var typesURL = '/api/projectsflow/getflow/colleges/' + $scope.data.currentCollege + '/' + curUserDepartment + '/' + $scope.data.currentType;


                $http(
                    {
                        method: 'GET',
                        url: typesURL
                    }
                ).success(
                    function (resFlow) {
                        $scope.projectData.flow = resFlow[0];
                        $scope.projectData.curState = {
                            curStatus: resFlow[0].Stage[0].Status.Name,
                            curStage: resFlow[0].Stage[0].Name, //TODO
                            curOrder: 0
                        }
                    }, true
                )
            }
    };

    /*
     * College watcher - in case we will need to change project's type
     * If so, we need to load that college project flow by it's type.
     */

    $scope.$watch('data.currentType', function (newValue) {
            if (!initProcess)
                if (angular.isDefined($scope.data.currentCollege) && angular.isDefined($scope.data.currentType))
                if ($scope.data.currentCollege != -1 && $scope.data.currentType != -1) {
                    var typesURL = '/api/projectsflow/getflow/colleges/' + $scope.data.currentCollege + '/' + curUserDepartment + '/' + $scope.data.currentType;


                    $http(
                        {
                            method: 'GET',
                            url: typesURL
                        }
                    ).success(
                        function (resFlow) {
                            $scope.projectData.flow = resFlow[0];
                            $scope.projectData.curState = {
                                curStatus: resFlow[0].Stage[0].Status.Name,
                                curStage: resFlow[0].Stage[0].Name, //TODO
                                curOrder: 0
                            }
                        }, true
                    )
                }
        }
        , true);

    /******************************************************************/
    /************************Functions*********************************/
    /******************************************************************/


    /*
     * Sends new or edit project to the nodejs server
     */
    $scope.createProject = function () {

        $http.post('/api/projects/save', $scope.projectData)
            .success(function (data) {
                $scope.newProject = data;
                //$scope.projectData = {}; // clear the form so our project is ready to enter another
                //console.log(data)
                if ($scope.projectData._id != $scope.newProject._id) {


                    toastr.success("הפרויקט נוצר בהצלחה", globalSettings.toastrOpts);
                    $location.path("account/lecturer/project/" + data._id);


                }
                else {

                    toastr.success("הפרויקט עודכן בהצלחה", globalSettings.toastrOpts);

                }
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };



    $scope.save_end_proj = function () {

        $http.post('/api/projects/end-of-proj', $scope.projectData)
            .success(function (data) {
                $scope.newProject = data;
                //$scope.projectData = {}; // clear the form so our project is ready to enter another
                //console.log(data)
                if ($scope.projectData._id != $scope.newProject._id) {


                    toastr.success("הפרויקט נוצר בהצלחה", globalSettings.toastrOpts);
                    $location.path("account/lecturer/project/" + data._id);


                }
                else {

                    toastr.success("הפרויקט עודכן בהצלחה", globalSettings.toastrOpts);

                }
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };


    /*
     * Adds new lecturer to the project's data
     */
    $scope.addLecturer = function () {
        var addedLecturer = {
            id: $scope.selectedLecturer._id,
            name: $scope.selectedLecturer.firstName + " " + $scope.selectedLecturer.lastName,
            email: $scope.selectedLecturer.Email
        };


        if (typeof addedLecturer.id != 'undefined') {
            $scope.projectData.lecturers.push(addedLecturer);
            $scope.lecturers.splice($scope.lecturers.indexOf($scope.selectedLecturer), 1);
            $scope.createProject();


            toastr.success("המנחה נוסף", globalSettings.toastrOpts);

        }
    };


    /*
     * Adds new lecturer to the project's data
     */
    $scope.removeLecturer = function (lecturer) {

        if (lecturer.id != curUserID) {
            $scope.projectData.lecturers.splice($scope.projectData.lecturers.indexOf(lecturer), 1);

            $http.post('/api/projects/save', $scope.projectData)
                .success(function (data) {
                    toastr.success("המנחה הוסר", globalSettings.toastrOpts);

                })
                .error(function (data) {
                    console.log('Error: ' + data);
                });
        }
        else {
            alert('לא ניתן להסיר את עצמך');

        }
    };

    /*
     * Adds new lecturer to the project's data
     */
    $scope.addLiteratureSource = function () {
        var addedSource = $scope.literatureSources;

        if (typeof addedSource != 'undefined') {
            $scope.projectData.literatureSources.push(addedSource);
        }
    };

    /*
     * Adds new student to the project's data
     */
    $scope.addStudent = function () {
        var LevelUp = false;

        var addedStudent = {
            id: $scope.selectedStudent1._id,
            name: $scope.selectedStudent1.firstName + " " + $scope.selectedStudent1.lastName,
            email: $scope.selectedStudent1.Email
        };
        if (typeof addedStudent.id != 'undefined') {
            if ($scope.projectData.students) {
                if ($scope.projectData.students.length == 0) {
                    $scope.projectData.isPaired = true;
                    LevelUp = true;
                }
            }
            else {
                $scope.projectData.students = [];
                $scope.projectData.isPaired = true;
                LevelUp = true;
            }
            $scope.projectData.students.push(addedStudent);
            $scope.students = $scope.students.filter(function (student) {
                return student.id != addedStudent.id
            });

            $scope.students.splice($scope.students.indexOf($scope.selectedStudent1), 1);
            var indata = {
                addedStudent: addedStudent,
                projectId: $scope.projectData._id,
                isPaired: $scope.projectData.isPaired,
                LevelUp: LevelUp
            };
            $http.post('/api/project/addstudent', indata)
                .success(function (data1) {
                    $scope.LevelUp = '';
                    $scope.addedStudent = '';
                    indata = '';
                    $scope.selectedStudent1 = "";


                    toastr.success("הסטודנט נוסף", globalSettings.toastrOpts);

                })
                .error(function (data1) {
                    alert('Error: ' + data);
                });
        }
    };

    /*
     * Remove student to the project's data
     */
    $scope.removeStudent = function (removedStudent) {
        var emptyProj = false;

        if (typeof removedStudent.id != 'undefined') {

            $scope.projectData.students.splice($scope.projectData.students.indexOf(removedStudent), 1);

            if ($scope.projectData.students.length == 0) {
                $scope.projectData.isPaired = false;
                emptyProj = true;
            }

            var data = {
                removedStudent: removedStudent,
                removedStudentList: $scope.projectData.students,
                projectId: $scope.projectData._id,
                projectStatus: $scope.projectData.isPaired,
                emptyProj: emptyProj
            };
            $http.post('/api/project/removestudent', data)
                .success(function (resData) {


                    toastr.success("הסטודנט הוסר", globalSettings.toastrOpts);


                    /*
                     * Get students in order to add to project.
                     * Loading only students who wasn't added to current project.
                     * If new project - loading all students.
                     */
                    $http({
                        method: 'GET',
                        url: '/api/users/not-in-project/student/' + curProjectID,
                    }).then(function (result) {
                        $scope.students = result.data;
                    });
                })
                .error(function (resData) {
                    alert('Error removeStudent: ' + resData);
                });
        }
    };

    /*
     * When the project is ready, the lecturer send it to the projects-manager
     */
    $scope.sendApproval = function () {
        if ($scope.projectData) {
            if ($scope.projectData.isPaired) {
                Projects.sendForApproval($scope.projectData._id).success(function () {
                    $scope.ApprovalSend = true;
                    $scope.projectData.waitingApproval = true;

                    toastr.success("הבקשה נשלחה", globalSettings.toastrOpts);
                    jQuery('#modal-33').modal('hide');

                });
            }
            else {
                $scope.nostudents = true;
            }
        }
    };

    /*
     * When the project is ready, the lecturer send it to the projects-manager
     */
    $scope.deleteProject = function () {
        if ($scope.projectData) {
            Projects.deleteProject($scope.projectData._id).success(function () {
                toastr.success("הפרוייקט נמחק, אתם מועברים לניהול פרויקטים", globalSettings.toastrOptss);
                jQuery('#modal-delete').modal('hide');


                $timeout(function () {
                    $location.path('/account/lecturer');
                }, 3000);
            });
        }
    };

    /**
     *This function closes the alert
     */
    $scope.closeAlertStud = function () {

        //remove the alert from the array to avoid showing previous alerts
        $scope.nostudents = false;
    };


    $scope.filterByName = function filterByName(studentsArr, typedValue) {
        var result = false;
        if (angular.isDefined(studentsArr)) {
            result = studentsArr.filter(function (student) {
                matches_first_name = student.firstName.indexOf(typedValue) != -1;
                matches_last_name = student.lastName.indexOf(typedValue) != -1;

                return matches_first_name || matches_last_name;
            });
        }
        return result;
    };

    $scope.selectStudent = function (selectedStud) {
        if (!initProcess)
            $scope.selectedStudent1 = selectedStud;
    };
});

