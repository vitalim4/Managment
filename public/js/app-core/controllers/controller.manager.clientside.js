angular.module("FPM").controller('projectManagerRequests', function ($scope, $http, $location, Projects, DataTablesOptions, localStorageService) {

    //check user permissions
    var curUserAuth = localStorageService.get('userRoleSlug');
    if (curUserAuth === 'lecturer' || curUserAuth === 'student') {

        localStorageService.clearAll();
        $http.get('/logout');
        $location.path('/login');

    }

    $scope.dtOptionsManagerRequests = DataTablesOptions.GlobalOptionsManager();


    $scope.requestsData = {};
    $scope.requestId = -1;
    $scope.curRequest = {};
    $scope.showRejection = false;
    $scope.showButtonsApprove = true;
    $scope.RequestDone = false;
    $scope.rejectionReason = "";

    Projects.getRequestsByManager()
        .success(function (data) {
            $scope.requestsData = data;
            // });


        });
});

angular.module("FPM").controller('managerSingleUserController', function ($scope, $http, $location, $window, $rootScope, Users, localStorageService, $routeParams, $filter, Upload, $timeout, globalSettings) {

    /******************************************************************/
    /************************On Page Load******************************/
    /******************************************************************/
    /*
     * Local variables
     */

     console.log("managerSingleUserController entered")
    //check user permissions
    var curUserAuth = localStorageService.get('userRoleSlug');
    var userDep =localStorageService.get('userDepartment')
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.userData = {};
    $scope.newUser = {};

    var userNames = [];


    var initProcess = false;

    $scope.userData._id = $routeParams.userId;


    $scope.submFile = function () { //function to call on form submit
        if ($scope.curFile.$error !== "pattern") {
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
                filePath = filePath.replace('public\\', '');
                $scope.userData.picUrl = filePath;
                $scope.isPreview = false;
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
     * Loading all existing roles to form
     */
    $http({
        method: 'GET',
        url: '/api/roles'
    }).success(function (result) {
        $scope.roles = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/departments'
    }).success(function (result) {
        if (curUserAuth === 'lecturer' || curUserAuth==='manager')
        {
            $scope.departments = result;
        }
        else if(curUserAuth ==='admin'){
            $scope.departments = result;
        }     
        $scope.departments = result;
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
 * Loading all existing departments to form
 */
$http({
        method: 'GET',
        url: '/api/colleges'
    }).success(function (result) {
        $scope.colleges = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/user/usernames'
    }).success(function (result) {
        userNames = result;
    });

    /*
     * User data loading into a local object
     * Also we loading user types out of another
     * collection in case we will need to change users type.
     * */
    var localUserName;
    $scope.userData.creation = false;
    if ($scope.userData._id !== null && typeof($scope.userData._id) !== "undefined") {
        $scope.userData.creation = false;

        Users.getSingle($scope.userData._id)
            .success(function (userDataDB) {
                initProcess = true;

                $scope.userData = userDataDB;
                localUserName = $scope.userData.Username;
                $scope.userData.Birthday = new Date(userDataDB.Birthday);
                $scope.userData.Role = $scope.roles.filter(function (role) {
                    return role.Slug === userDataDB.Role.Slug;
                })[0];
                $scope.userData.Department = $scope.departments.filter(function (department) {
                    return department.Slug === userDataDB.Department.Slug;
                })[0];
                $scope.userData.Semester = $scope.semesters.filter(function (semester) {
                    return semester.Slug === userDataDB.Semester.Slug;
                })[0];
                $scope.userData.Year = $scope.years.filter(function (year) {
                    return year.Name === userDataDB.Year.Name;
                })[0];
                $scope.userData.College = $scope.colleges.filter(function (college) {
                    return college.Name === userDataDB.College.Name;
                })[0];

                $scope.PageMode = 'edit';

            });
    }
    else{
        $scope.userData.creation = true;
    }

    /*$scope.change = function (changedProperty) {
     /*switch (changedProperty) {
     case 'role':
     $scope.userData.Role = $scope.userData.rol;
     break;
     case 'department':
     alert("Selected Case Number is 2");
     break;
     case 'college':
     alert("Selected Case Number is 2");
     break;
     default:

     }
     console.log($scope.userData.rol);
     };*/

    /*
     * College watcher - in case we will need to change project's college
     * If so, we need to load that college project types.
     */
    $scope.$watch('userData.Username', function (newValue, oldValue) { 
        if (typeof newValue !== 'undefined' && /*typeof $scope.data !== 'undefined'*/ typeof oldValue !== 'undefined') {
            if (userNames.indexOf(newValue) !== -1) {
                if(localUserName !== newValue){
                    $scope.userExistName = true;
                }                   
            }
            else if ($scope.userExistName) {
                $scope.userExistName = false;
            }
        }
    }
    , true);


    /******************************************************************/
    /************************Functions*********************************/
    /******************************************************************/
    /*
     * Sends new or edit user to the nodejs server
     */
    $scope.saveUser = function () {
        $http.put('/api/users', {data: $scope.userData})
            .success(function (dataDB) {
                $scope.newUser = dataDB;
                if (angular.isDefined($scope.userData._id)) {
                    if ($scope.userData._id !== $scope.newUser._id) {
                        toastr.success("המשתמש נוצר בהצלחה", globalSettings.toastrOpts);
                        //$location.path("account/manager/users/" + dataDB._id);
                        $timeout(function() {
                            if(curUserAuth == "manager"){
                                $location.path("/account/manager");
                            }
                            else if(curUserAuth == "admin"){
                                $location.path("/account/admin");
                            }
                            else{
                                $location.path("account/manager/users/");
                            }
                            
                        }, 2000);
                    }
                    else {
                        toastr.success("המשתמש עודכן בהצלחה", globalSettings.toastrOpts);
                    }
                }
                else {
                    toastr.success("המשתמש נוצר בהצלחה", globalSettings.toastrOpts);
                   
                        //$location.path("account/manager/users/" + dataDB._id);
                        $timeout(function() {
                            if(curUserAuth == "manager"){
                                $location.path("/account/manager");
                            }
                            else if(curUserAuth == "admin"){
                                $location.path("/account/admin");
                            }
                            else{
                                $location.path("account/manager/users/");
                            }
                            
                        }, 2000);

                }
            })
            .error(function (dataDB) {
                console.log('Error: ' + dataDB);
            });
    };

});

angular.module("FPM").controller('projectManagerRequestsArchive', function ($scope, $http, $location, Projects, DataTablesOptions,localStorageService,  globalSettings) {

    //check user permissions
    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.dtOptionsManagerRequests = DataTablesOptions.GlobalOptionsManager();


    $scope.requestsData = {};
    $scope.requestId = -1;
    $scope.curRequest = {};
    $scope.showRejection = false;
    $scope.showButtonsApprove = true;
    $scope.RequestDone = false;
    $scope.rejectionReason = "";

    Projects.getRequestsByManagerArchive()
        .success(function (data) {
            $scope.requestsData = data;
        });


});

angular.module("FPM").controller('requestsManager', function ($scope, $routeParams, Projects, globalSettings, localStorageService) {


    //check user permissions
    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }


    $scope.requestData = {};

    $scope.requestData._id = $routeParams.requestId;

    $scope.isSent = false;


    /*
     * Project data loading into a local object
     * Also we loading project types out of another
     * collection in case we will need to change projects type.
     * */
    if ($scope.requestData._id !== null) {
        Projects.getRequest($scope.requestData._id)
            .success(function (data) {
                $scope.requestData = data;
                if (data && data.projectId !== null) {
                    if (data.updateDate !== data.creationDate) {
                        $scope.isSent = true;
                    }

                    Projects.getSingle(data.projectId)
                        .success(function (data) {
                            $scope.projectData = data;
                        });
                }

            });

    }


    $scope.sendRejection = function () {
        var requestId = $scope.requestData._id;

        if (requestId) {
            var reason = JSON.stringify($scope.rejectionReason);
            Projects.rejectApprovalRequest(requestId, reason).success(function (data) {
                $scope.requestsData = data;
                $scope.RequestRejected = true;
                $scope.showRejection = false;
                $scope.showButtonsApprove = false;
                $scope.isSent = true;


                toastr.success("הבקשה נדחתה", globalSettings.toastrOpts);


            });
        }
    };

    $scope.ApproveProject = function () {
        if ($scope.requestData._id)
            Projects.acceptApprovalRequest($scope.requestData._id)
                .success(function (data) {
                    Projects.getRequestsByManager()
                        .success(function (data) {
                            $scope.requestsData = data;
                            $scope.RequestDone = true;
                            $scope.showRejection = false;
                            $scope.showButtonsApprove = false;
                            $scope.isSent = true;

                            toastr.success("הבקשה אושרה", globalSettings.toastrOpts);
                        });
                });
    };

    $scope.commtxt = "";
    $scope.comm = false;

    $scope.sendCommentUI = function () {
        if ($scope.commtxt !== "") {
            if ($scope.requestData._id)
                Projects.sendComment($scope.requestData._id, $scope.commtxt)
                    .success(function (data) {

                        toastr.success("ההערה נשלחה", globalSettings.toastrOpts);

                        $scope.comm = false;

                    });
        }
        else {
            alert("יש להזין הערה")
        }
    }

});

angular.module("FPM").controller('managerProjectsController', function ($scope, $window, $http, localStorageService, DTColumnBuilder, DTOptionsBuilder, globalSettings,Projects, $timeout,$location) {

    $scope.pieIsClicked = false;
    console.log("managerProjectsController entered")

    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    var translation = globalSettings.tableTranslation;
    $scope.disabled = true;

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('projectName').withTitle('שם הפרויקט'),
        DTColumnBuilder.newColumn('curStatus').withTitle('שלב'),
        DTColumnBuilder.newColumn('shortDescription').withTitle('תיאור הפרויקט'),
        DTColumnBuilder.newColumn('Department.Name').withTitle('מחלקה')
    ];


    $scope.dtReportsCol = [
        DTColumnBuilder.newColumn('index').withTitle('#'),
        DTColumnBuilder.newColumn('projectName').withTitle('שם הפרויקט'),
        DTColumnBuilder.newColumn('projDescrip').withTitle('תיאור הפרויקט'),
        DTColumnBuilder.newColumn('shortDescription').withTitle('תקציר'),
        DTColumnBuilder.newColumn('students.email').withTitle('שמות הסטודנטים'),
        DTColumnBuilder.newColumn('students.name').withTitle('סטודנטים אימיילים'),
        DTColumnBuilder.newColumn('literatureSources').withTitle('מקורות'),
        DTColumnBuilder.newColumn('lecturers.name').withTitle('מנחים מקצועיים'),
        DTColumnBuilder.newColumn('professionalGuide').withTitle('מרצים'),
        DTColumnBuilder.newColumn('lecturers.email').withTitle('מנחים אימיילים'),
        DTColumnBuilder.newColumn('isPaired').withTitle('מצוות'),
        DTColumnBuilder.newColumn('curStatus').withTitle('שלב'),
        DTColumnBuilder.newColumn('curState.curStage').withTitle('שלב'),
        DTColumnBuilder.newColumn('curState.curOrder').withTitle('מס׳ שלב'),
        DTColumnBuilder.newColumn('waitingApproval').withTitle('מחכה לאישור'),
        DTColumnBuilder.newColumn('Semester.Name').withTitle('סמסטר'),
        DTColumnBuilder.newColumn('Year.Name').withTitle('שנה'),
        DTColumnBuilder.newColumn('College.Name').withTitle('קמפוס'),
        DTColumnBuilder.newColumn('Department.Name').withTitle('מחלקה'),
        DTColumnBuilder.newColumn('Type.Name').withTitle('סוג הפרויקט')
    ];

    var projectsWOFilter = [];

    var sortedProjects = [];
    var archivedProjects = [];
    $scope.archivedProjectsData = archivedProjects;
    $scope.projectsData = sortedProjects;
    $scope.modalState = "";
    $scope.isLoading = false;
    $scope.numOfMyProject = -1;

    Projects.getRequestsByManagerArchive()
    .success(function (data) {       
        archivedProjects = data;
        $scope.archivedProjectsData = archivedProjects;
        $scope.requestsData = data;
    });

    $http.get('/api/manager/projects/')
        .success(function (data) {
            sortedProjects = data;
            $scope.projectsData = sortedProjects;
            projectsWOFilter = angular.copy(data);

            $scope.numOfMyProject = data.length;
            $scope.numOfKolKore = data.filter(function (proj) {
                return proj.curState.curStatus === 'קול קורא';
            }).length;
            $scope.numOfWaiting = data.filter(function (proj) {
                return proj.curState.curStatus === 'ממתין לאישור';
            }).length;
            $scope.numOfProccess = data.filter(function (proj) {
                return proj.curState.curStatus === 'בביצוע';
            }).length;
            $scope.numOfGrouped = data.filter(function (proj) {
                return proj.curState.curStatus === 'ניסוח הצעה';
            }).length;
            $scope.numOfArchives = data.filter(function (proj) {
                return proj.curState.curStatus === 'פרוייקט גמור';
            }).length;
            resetFilters();
        });
   

    var resetFilters = function () {
        $http.get('/api/manager/project-filters/')
            .success(function (data) {
                $scope.filtersSet = data;
                $scope.filterApply = {};
                $scope.filterApply.students = [];
                $scope.filterApply.lecturers = [];
                $scope.filterApply.stages = [];
                $scope.filterApply.statuses = [];
                $scope.filterApply.projectflows = [];
                $scope.filterApply.projectsemesters = [];
                $scope.filterApply.projectdepartments = [];
                $scope.filterApply.projectcolleges = [];
                $scope.filterApply.projectyears = [];
                $scope.filterApply.projectName = "";
                $scope.filterApply.projectStage = "";
                $scope.filterApply.projectStatus = "";
                $scope.filterApply.projectFlows = "";
                $scope.filterApply.projectSemesters = "";
                $scope.filterApply.projectDepartments = "";
                $scope.filterApply.projectColleges = "";
                $scope.filterApply.projectYears = "";

                var localObject = localStorage.getItem('filters');
                var retrievedObject = JSON.parse(localObject);
                if(typeof (retrievedObject) !== undefined && retrievedObject != null){
                    $scope.filterApply.students = retrievedObject.students;
                    $scope.filterApply.lecturers = retrievedObject.lecturers;
                    $scope.filterApply.stages = retrievedObject.stages;
                    $scope.filterApply.statuses = retrievedObject.statuses;
                    $scope.filterApply.projectName = retrievedObject.projectName;
                    $scope.filterApply.projectStage = retrievedObject.projectStage;
                    $scope.filterApply.projectStatus = retrievedObject.projectStatus;
                    $scope.filterApply.projectFlows = retrievedObject.projectFlows;
                    $scope.filterApply.projectSemesters = retrievedObject.projectSemesters;
                    $scope.filterApply.projectDepartments = retrievedObject.projectDepartments;
                    $scope.filterApply.projectColleges = retrievedObject.projectColleges;
                    $scope.filterApply.projectYears = retrievedObject.projectYears;
                    $scope.filterApply.isPaired = retrievedObject.isPaired;
                    $scope.projectsData = retrievedObject.projectsData;
                    if($scope.filterApply.projectStatus == "בביצוע"){
                        $scope.checkInProccessStatus("בביצוע");
                    }
                }

            });
    };

    $scope.$on('$routeChangeStart', function($event, next, current) {          
        if(next.$$route.templateUrl == "partials/manager-single-project.html"){
            $scope.localfilters = {
                "students":$scope.filterApply.students,
                "lecturers":$scope.filterApply.lecturers,
                "stages":$scope.filterApply.stages,
                "statuses":$scope.filterApply.statuses,
                "projectName":$scope.filterApply.projectName,
                "projectStage":$scope.filterApply.projectStage,
                "projectStatus":$scope.filterApply.projectStatus,
                "projectFlows":$scope.filterApply.projectFlows,
                "projectSemesters":$scope.filterApply.projectSemesters,
                "projectDepartments":$scope.filterApply.projectDepartments,
                "projectColleges":$scope.filterApply.projectColleges,
                "projectYears":$scope.filterApply.projectYears,
                "isPaired":$scope.filterApply.isPaired,
                "projectsData":$scope.projectsData
            };     
            localStorage.setItem("filters",JSON.stringify( $scope.localfilters));
        }
        else{
            localStorage.removeItem("filters");
        }                
    });

    $scope.filterKolKore = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'קול קורא';
        });
    };
    $scope.filterGrouped = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'ניסוח הצעה';
        });
    };
    $scope.filterWaiting = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'ממתין לאישור';
        });
    };
    $scope.filterAction = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'בביצוע';
        });
    };

    $scope.clearFilter = function () {
        $scope.projectsData = projectsWOFilter;
        localStorage.removeItem("filters");
        resetFilters();
    };

    $scope.filterByName = function filterByName(usersArr, typedValue) {
        var result = usersArr.filter(function (user) {
            var matches_phone = false;
            matches_first_name = user.firstName.indexOf(typedValue) !== -1;
            matches_last_name = user.lastName.indexOf(typedValue) !== -1;

            if (angular.isDefined(user.Phone))
                if (user.Phone !== null)
                    matches_phone = user.Phone.indexOf(typedValue) !== -1;

            return matches_first_name || matches_last_name || matches_phone;
        });
        return result;
    };

    $scope.addFilter = function (ObjType) {

        switch (ObjType) {
            case 'student':
                $scope.filterApply.students.push($scope.filterStudent);
                $scope.filtersSet.students.splice($scope.filtersSet.students.indexOf($scope.filterStudent), 1);
                delete $scope.filterStudent;
                break;
            case 'lecturer':
                $scope.filterApply.lecturers.push($scope.filterLecturer);
                $scope.filtersSet.lecturers.splice($scope.filtersSet.lecturers.indexOf($scope.filterLecturer), 1);
                delete $scope.filterLecturer;
                break;
            default:
        }

    };

    $scope.pickFilter = function (filteredObject, ObjType) {
        switch (ObjType) {
            case 'student':
                $scope.filterStudent = filteredObject;
                break;
            case 'lecturer':
                $scope.filterLecturer = filteredObject;
                break;
            default:
        }
    };

    $scope.removeUserFilter = function (userObj, ObjType) {
        switch (ObjType) {
            case 'student':
                $scope.filterApply.students.splice($scope.filterApply.students.indexOf(userObj), 1);
                $scope.filtersSet.students.push(userObj);
                break;
            case 'lecturer':
                $scope.filterApply.lecturers.splice($scope.filterApply.lecturers.indexOf(userObj), 1);
                $scope.filtersSet.lecturers.push(userObj);
                break;
            default:
        }
    };

    $scope.pieChartShow = function () {
        $scope.pieIsClicked = true;
    };

    $scope.pieChartHide = function () {
        $scope.pieIsClicked = false;
    };

    $scope.barChartShow = function () {
        $scope.barIsClicked = true;
    };

    $scope.barChartHide = function () {
        $scope.barIsClicked = false;
    };
    $scope.changedFlowType = function(data){
        var dataFlow = document.getElementById("filterApply.projectFlows").value;
        var typeFlow;
        switch (dataFlow)
        {
            case "מחקר":
                typeFlow = "research";
            break;
            case "פיתוח":
                typeFlow = "development";
            break;
            case "משולב":            
                typeFlow = "combined";
            break;
            default:
                typeFlow = "research";

        }
        var dep = document.getElementById("filterApply.projectDepartments").value;

        var department = "software"
        switch (dep)
        {
            case "הנדסת תוכנה":
                department = "software";
            break;
            case "הנדסת כימיה":
                department = "chemical";
            break;
            case "הנדסת מכונות":            
                department = "mechanical";
            break;
            case "הנדסת חשמל":
                department = "Electrical";
            break;
            case "הנדסת תעשיה וניהול":            
                department = "industrial";
            break;
            default:
                department = localStorageService.get('userDepartmentSlug');

        }
        var collegeSlug = document.getElementById("filterApply.projectColleges").value;

        var college = "default"
        switch (collegeSlug)
        {
            case "SCE באר שבע":
                collegeSlug = "sce-b7";
            break;
            case "SCE אשדוד":
                collegeSlug = "sce-ashdod";
            break;
            default:
                collegeSlug = "sce-b7";

        }

        $http.get('/api/manager/project-filters/'+typeFlow+"/"+department+"/"+collegeSlug)
            .success(function (data) {
                $scope.filtersSet = data;
            });
    }
	
	
	 var excludeStatus = ["קול קורא","ניסוח הצעת פרוייקט למנהל פרוייקטים",
                        "ממתין לאישור מנהל פרוייקטים", "הגשת הפרויקט","פרוייקט שהוצג ועבר בהצלחה",
                        "פרוייקט נכשל"];

    $scope.hideNotInProccess = function(name){
        if(excludeStatus.indexOf(name) !== -1) {
            return true;
        }
        else{
            return false;
        }
    }

    $scope.disabled = true;
    $scope.checkInProccessStatus = function(status){
        if(status == "בביצוע"){
            $scope.disabled = false;
        }
        else
        {
            $scope.disabled = true;
            $scope.filterApply.projectStage = "";
        }
    }

    $http({
        method: 'GET',
        url: '/api/roles'
    }).success(function (result) {
        $scope.roles = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/departments'
    }).success(function (result) {
        if (curUserAuth === 'lecturer' || curUserAuth==='manager')
        {

            $scope.departments = result;
        }
        else if(curUserAuth ==='admin'){

            $scope.departments = result;
            //console.log(userDep)
        }

        $scope.departments = result;
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
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/colleges'
    }).success(function (result) {
        $scope.colleges = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/user/usernames'
    }).success(function (result) {
        userNames = result;
    });


    /******************************************************************/
    /***********************Watchers***********************************/
    /******************************************************************/

    /*
     * Once filterApply changed, filter the projects list
     */

    $scope.$watch('filterApply', function (newValue) {

            options = DTOptionsBuilder.newOptions()
                .withPaginationType('full_numbers')
                // Active Buttons extension
                .withButtons([
                    'colvis', 'copy', 'excel', 'print', 'colvisRestore',
                    {
                        text: 'יצא הכל (CSV)',
                        key: '1',
                        action: function (e, dt, node, config) {

                            var exportCSV = [];

                            for (var projectObj in $scope.projectsData) {
                                var exportProject = {
                                    nameHeb: "",
                                    nameEng: "",
                                    shortDescription: "",
                                    projDescrip: "",
                                    professionalGuide: "",
                                    neededKnowledge: "",
                                    literatureSources: "",
                                    lecturers: "",
                                    students: "",
                                    type: "",
                                    college: "",
                                    isPaired: "",
                                    waitingApproval: "",
                                    isInProcess: "",
                                    curState: "",
                                    createdDate: "",
                                    creationYear: ""

                                };

                                exportProject.nameHeb = sortedProjects[projectObj].nameHeb;
                                exportProject.nameEng = sortedProjects[projectObj].nameEng;
                                exportProject.shortDescription = sortedProjects[projectObj].shortDescription;
                                exportProject.projDescrip = sortedProjects[projectObj].projDescrip;
                                exportProject.neededKnowledge = sortedProjects[projectObj].neededKnowledge;
                                exportProject.literatureSources = sortedProjects[projectObj].literatureSources;
                                exportProject.professionalGuide = sortedProjects[projectObj].professionalGuide;
                                exportProject.isPaired = sortedProjects[projectObj].isPaired;
                                exportProject.waitingApproval = sortedProjects[projectObj].waitingApproval;
                                exportProject.isInProcess = sortedProjects[projectObj].isInProcess;
                                exportProject.curState = sortedProjects[projectObj].curState.curStage + ' ' + sortedProjects[projectObj].curState.curStatus;
                                exportProject.type = sortedProjects[projectObj].flow.Type.Name;
                                exportProject.college = sortedProjects[projectObj].flow.College.Name;
                                exportProject.createdDate = sortedProjects[projectObj].createdDate;
                                exportProject.creationYear = sortedProjects[projectObj].Year.Name;
                                for (var index in  sortedProjects[projectObj].lecturers) {
                                    exportProject.lecturers += sortedProjects[projectObj].lecturers[index].name + ' ,';
                                }
                                exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                                for (var index in  sortedProjects[projectObj].students) {
                                    exportProject.students += sortedProjects[projectObj].students[index].name + ' ,';
                                }
                                exportProject.students = exportProject.students.substring(0, exportProject.students.length - 1);

                                exportCSV.push(exportProject);
                            }

                            var data = Papa.unparse(exportCSV);

                            data = data.replace("nameHeb", "שם בעברית");
                            data = data.replace("nameEng", "שם באנגלית");
                            data = data.replace("shortDescription", "תקציר");
                            data = data.replace("projDescrip", "תיאור הפרויקט");
                            data = data.replace("neededKnowledge", "ידע נדרש");
                            data = data.replace("literatureSources", "מקורות ספרות");
                            data = data.replace("isPaired", "מצוות");
                            data = data.replace("waitingApproval", "ממתין לאישור");
                            data = data.replace("isInProcess", "בתהליך");
                            data = data.replace("curState", "שלב נוכחי");
                            data = data.replace("type", "סוג הפרויקט");
                            data = data.replace("college", "קמפוס");
                            data = data.replace("createdDate", "תאריך יצירה");
                            data = data.replace("creationYear", "שנה אקדמאית");
                            data = data.replace("lecturers", "מרצים");
                            data = data.replace("students", "סטודנטים");

                            var today = new Date();
                            var dd = today.getDate();
                            var mm = today.getMonth() + 1; //January is 0!

                            var yyyy = today.getFullYear();
                            if (dd < 10) {
                                dd = '0' + dd
                            }
                            if (mm < 10) {
                                mm = '0' + mm
                            }

                            //console.log(data);

                            var hiddenElement = document.createElement('a');
                            hiddenElement.setAttribute("href", "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(data));

                            hiddenElement.target = '_blank';
                            hiddenElement.download = 'דוח פרויקטים ' + dd + '-' + mm + '-' + yyyy + ' ' + today.getHours() + today.getMinutes() + '.csv';
                            hiddenElement.click();

                        }

                    },
                    {
                        text: 'יצא הכל (Excel)',
                        key: '2',
                        action: function (e, dt, node, config) {

                            var exportExcel = [];

                            for (var projectObj in $scope.projectsData) {
                                var exportProject = {
                                    nameHeb: "",
                                    nameEng: "",
                                    shortDescription: "",
                                    projDescrip: "",
                                    professionalGuide: "",
                                    neededKnowledge: "",
                                    literatureSources: "",
                                    lecturers: "",
                                    students: "",
                                    type: "",
                                    college: "",
                                    isPaired: "",
                                    waitingApproval: "",
                                    isInProcess: "",
                                    curState: "",
                                    createdDate: "",
                                    creationYear: ""

                                };

                                exportProject.nameHeb = sortedProjects[projectObj].nameHeb;
                                exportProject.nameEng = sortedProjects[projectObj].nameEng;
                                exportProject.shortDescription = sortedProjects[projectObj].shortDescription;
                                exportProject.projDescrip = sortedProjects[projectObj].projDescrip;
                                exportProject.neededKnowledge = sortedProjects[projectObj].neededKnowledge;
                                exportProject.literatureSources = sortedProjects[projectObj].literatureSources;
                                exportProject.professionalGuide = sortedProjects[projectObj].professionalGuide;
                                exportProject.isPaired = sortedProjects[projectObj].isPaired;
                                exportProject.waitingApproval = sortedProjects[projectObj].waitingApproval;
                                exportProject.isInProcess = sortedProjects[projectObj].isInProcess;
                                exportProject.curState = sortedProjects[projectObj].curState.curStage + ' ' + sortedProjects[projectObj].curState.curStatus;
                                exportProject.type = sortedProjects[projectObj].flow.Type.Name;
                                exportProject.college = sortedProjects[projectObj].flow.College.Name;
                                exportProject.createdDate = sortedProjects[projectObj].createdDate;
                                exportProject.creationYear = sortedProjects[projectObj].Year.Name;
                                for (var index in  sortedProjects[projectObj].lecturers) {
                                    exportProject.lecturers += sortedProjects[projectObj].lecturers[index].name + ' ,';
                                }
                                exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                                for (var index in  sortedProjects[projectObj].students) {
                                    exportProject.students += sortedProjects[projectObj].students[index].name + ' ,';
                                }
                                exportProject.students = exportProject.students.substring(0, exportProject.students.length - 1);

                                exportExcel.push(exportProject);
                            }

                            var data = Papa.unparse(exportExcel);

                            data = data.replace("nameHeb", "שם בעברית");
                            data = data.replace("nameEng", "שם באנגלית");
                            data = data.replace("shortDescription", "תקציר");
                            data = data.replace("projDescrip", "תיאור הפרויקט");
                            data = data.replace("neededKnowledge", "ידע נדרש");
                            data = data.replace("literatureSources", "מקורות ספרות");
                            data = data.replace("isPaired", "מצוות");
                            data = data.replace("waitingApproval", "ממתין לאישור");
                            data = data.replace("isInProcess", "בתהליך");
                            data = data.replace("curState", "שלב נוכחי");
                            data = data.replace("type", "סוג הפרויקט");
                            data = data.replace("college", "קמפוס");
                            data = data.replace("createdDate", "תאריך יצירה");
                            data = data.replace("creationYear", "שנה אקדמאית");
                            data = data.replace("lecturers", "מרצים");
                            data = data.replace("students", "סטודנטים");

                            var today = new Date();
                            var dd = today.getDate();
                            var mm = today.getMonth() + 1; //January is 0!

                            var yyyy = today.getFullYear();
                            if (dd < 10) {
                                dd = '0' + dd
                            }
                            if (mm < 10) {
                                mm = '0' + mm
                            }

                            //console.log(data);

                            var hiddenElement = document.createElement('a');
                            hiddenElement.setAttribute("href", "data:text/excel;charset=utf-8,%EF%BB%BF" + encodeURI(data));

                            hiddenElement.target = '_blank';
                            hiddenElement.download = 'דוח פרויקטים ' + dd + '-' + mm + '-' + yyyy + ' ' + today.getHours() + today.getMinutes() + '.xls';
                            hiddenElement.click();

                        }
                    }])
                .withLanguage(translation)
                .withOption('scrollX', '100%');

            $scope.dtOptionsManagerProjects = options;

            if (typeof newValue !== 'undefined' && typeof $scope.filterApply !== 'undefiend') {

                $scope.isLoading = true;

                $timeout(function () {


                    $scope.projectsData = angular.copy(projectsWOFilter);
                    //console.log(projectsWOFilter); //project data
                    var sortedProjects = angular.copy(projectsWOFilter);

                    var filteredProjects = [];

                    var isPaired = $scope.filterApply.isPaired;
                    var isWaitForApp = $scope.filterApply.waitForApp;

                    //console.log($scope.filterApply);

                    for (var i = 0; i < sortedProjects.length; i++) {
                        /* Lecturers Filter */
                        if ($scope.filterApply.lecturers.length !== 0) {
                            for (var j = 0; j < $scope.filterApply.lecturers.length; j++) {
                                if (sortedProjects[i].lecturers.filter(function (lecturer) {
                                        return $scope.filterApply.lecturers[j]._id === lecturer.id
                                    }).length === 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Students Filter */
                        if ($scope.filterApply.students.length !== 0) {
                            for (var j = 0; j < $scope.filterApply.students.length; j++) {
                                if (sortedProjects[i].students.filter(function (student) {
                                        return $scope.filterApply.students[j]._id === student.id
                                    }).length === 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }

                        /* Project name Filter */
                        if ($scope.filterApply.projectName.length !== 0) {

                            if (angular.isDefined(sortedProjects[i].nameHeb) && angular.isDefined(sortedProjects[i].nameEng)) {
                                if (sortedProjects[i].nameHeb === "") {
                                    if (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0) {
                                        if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                            filteredProjects.push(sortedProjects[i]);
                                        }
                                    }
                                }
                                if (sortedProjects[i].nameEng === "") {
                                    if (sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) {
                                        if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                            filteredProjects.push(sortedProjects[i]);
                                        }
                                    }
                                }
                                if ((sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) && (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0)) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                            else if (!angular.isDefined(sortedProjects[i].nameHeb) && !angular.isDefined(sortedProjects[i].nameEng)) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }

                            }
                            else if (!angular.isDefined(sortedProjects[i].nameHeb)) {
                                if (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                            else if (!angular.isDefined(sortedProjects[i].nameEng)) {
                                if (sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }

                        }

                        /* Project stage Filter */
                        if ($scope.filterApply.projectStage.length !== 0) {
                            if (sortedProjects[i].curState.curStage !== $scope.filterApply.projectStage) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project status Filter */
                        if ($scope.filterApply.projectStatus.length !== 0) {
                            if (sortedProjects[i].curState.curStatus !== $scope.filterApply.projectStatus) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project type Filter */
                        if ($scope.filterApply.projectFlows.length !== 0) {
                            if (sortedProjects[i].flow.Type.Name !== $scope.filterApply.projectFlows) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project semester Filter */
                        if ($scope.filterApply.projectSemesters.length !== 0) {
                            if (sortedProjects[i].Semester.Name !== $scope.filterApply.projectSemesters) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project paired Filter*/
                        if (isPaired !== undefined) {
                            if ((isPaired === "true") && (sortedProjects[i].isPaired === false)) { //If you choose Paired ("true").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                            else if ((isPaired === "false") && (sortedProjects[i].isPaired === true)){ //If you choose not Paired ("false").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project approval Filter*/
                        if (isWaitForApp !== undefined) {
                            if ((isWaitForApp === "true") && (sortedProjects[i].waitingApproval === false)) { //If you choose waite for approval ("true").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                            else if ((isWaitForApp === "false") && (sortedProjects[i].waitingApproval === true)){ //If you choose not wait for approval ("false").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project  Filter */
                        if ($scope.filterApply.projectDepartments.length !== 0) {
                            if (sortedProjects[i].flow.Department.Name !== $scope.filterApply.projectDepartments) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project college Filter */
                        if ($scope.filterApply.projectColleges.length !== 0) {
                            if (sortedProjects[i].flow.College.Name !== $scope.filterApply.projectColleges) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project year Filter */
                        if ($scope.filterApply.projectYears.length !== 0) {
                            if (sortedProjects[i].Year.Name !== $scope.filterApply.projectYears) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }
                    }

                    for (j = 0; j < filteredProjects.length; j++) {
                        for (i = $scope.projectsData.length - 1; i >= 0; i--) {
                            if ($scope.projectsData[i]._id === filteredProjects[j]._id) {
                                $scope.projectsData.splice(i, 1);
                            }
                        }
                    }

/**********************************************************************************************************************/
/**********************************Start Create Charts*****************************************************************/
/**********************************************************************************************************************/

                    /**********************************Start Line Charts***********************************************/
                    var allLecturers = [];
                    var lectStatCurrentTable = [];
                    var lecturersCurrentTable = [];
                    var statusesAmounts = {kolkore: 0 , nisoah: 0, waitForApp: 0, inProgress: 0, finished: 0};

                    //Get all lecturers in current table.
                    for(i = 0; i < $scope.projectsData.length; i++){
                        if(allLecturers.indexOf($scope.projectsData[i].lecturers[0].name) === -1) {
                            allLecturers[i] = $scope.projectsData[i].lecturers[0].name;
                            if (allLecturers[i] !== undefined){
                                var lec = [allLecturers[i], {kolkore: 0 , nisoah: 0, waitForApp: 0, inProgress: 0, finished: 0}];
                                lectStatCurrentTable.push(lec);
                                lecturersCurrentTable.push(lec[0]);
                            }
                        }
                    }

                    $scope.series = ['קול קורא', 'ניסוח הצעה', 'ממתין לאישור', 'בביצוע', 'פרויקט גמור'];

                    //Calculate each lecturer amount of statuses.
                    for(i = 0; i < $scope.projectsData.length; i++){
                        //Get all statuses amounts
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[0]) { //אם הפרויקט בסטטוס קול קורא
                            statusesAmounts.kolkore++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[1]) { //אם הפרויקט בסטטוס ניסוח הצעה
                            statusesAmounts.nisoah++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[2]) { //אם הפרויקט בסטטוס ממתין לאישור
                            statusesAmounts.waitForApp++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[3]) { //אם הפרויקט בסטטוס בביצוע
                            statusesAmounts.inProgress++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[4]) { //אם הפרויקט בסטטוס פרויקט גמור
                            statusesAmounts.finished++;
                        }
                        //Get all statuses amounts per lecturer
                        for(j = 0; j < $scope.projectsData[i].lecturers.length; j++){
                            for(k = 0; k < lectStatCurrentTable.length; k++) {
                                if ($scope.projectsData[i].lecturers[j].name === lectStatCurrentTable[k][0]) {
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[0]) { //אם הפרויקט בסטטוס קול קורא עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].kolkore++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[1]) { //אם הפרויקט בסטטוס ניסוח הצעה עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].nisoah++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[2]) { //אם הפרויקט בסטטוס ממתין לאישור עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].waitForApp++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[3]) { //אם הפרויקט בסטטוס בביצוע עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].inProgress++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[4]) { //אם הפרויקט בסטטוס פרויקט גמור עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].finished++;
                                    }
                                }
                            }
                        }
                    }
                    //console.log(lectStatCurrentTable[0][1].kolkore);

                    //Put lecturers to table labels.
                    $scope.labels = [];
                    for(i = 0; i < lecturersCurrentTable.length; i++) {
                        $scope.labels.push(lecturersCurrentTable[i]);
                    }

                    //Put lecturers amount of statuses into chart.
                    $scope.data = [];
                    for(i = 0; i < 1; i++) {
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[0].push(lectStatCurrentTable[j][1].kolkore);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[1].push(lectStatCurrentTable[j][1].nisoah);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[2].push(lectStatCurrentTable[j][1].waitForApp);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[3].push(lectStatCurrentTable[j][1].inProgress);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[4].push(lectStatCurrentTable[j][1].finished);
                        }
                    }
                    //console.log($scope.data);

                    $scope.onClick = function (points, evt) {
                        console.log(points, evt);
                    };
                    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
                    $scope.options = {
                        legend: { display: true },
                        scales: {
                            yAxes: [
                                {
                                    id: 'y-axis-1',
                                    type: 'linear',
                                    display: true,
                                    position: 'left'
                                }
                            ]
                        }
                    };

                    /**********************************Start Pie Charts***********************************************/

                    var allStatuses = statusesAmounts.kolkore + statusesAmounts.nisoah + statusesAmounts.waitForApp + statusesAmounts.inProgress + statusesAmounts.finished;
                    var kolKorePerc = (statusesAmounts.kolkore / allStatuses) * 100;
                    var nisoahPerc = (statusesAmounts.nisoah / allStatuses) * 100;
                    var waitForAppPerc = (statusesAmounts.waitForApp / allStatuses) * 100;
                    var inProgressPerc = (statusesAmounts.inProgress / allStatuses) * 100;
                    var finishedPerc = (statusesAmounts.finished / allStatuses) * 100;
                    kolKorePerc= Math.floor(kolKorePerc);
                    nisoahPerc= Math.floor(nisoahPerc);
                    waitForAppPerc= Math.floor(waitForAppPerc);
                    inProgressPerc= Math.floor(inProgressPerc);
                    finishedPerc= Math.floor(finishedPerc);

                    $scope.labels2 = ['קול קורא', 'ניסוח הצעה', 'ממתין לאישור', 'בביצוע', 'פרויקט גמור'];
                    $scope.data2 = [kolKorePerc, nisoahPerc, waitForAppPerc, inProgressPerc, finishedPerc];


                    $scope.options2 = {
                        legend: { display: true }
                    };
/**********************************************************************************************************************/
/**********************************End Create Charts*******************************************************************/
/**********************************************************************************************************************/

                    $scope.isLoading = false;
                }, 1000);
            }
        }
        , true);

});

angular.module("FPM").controller('lecturerReportController', function ($scope, $window, $http, localStorageService, DTColumnBuilder, DTOptionsBuilder, globalSettings,Projects, $timeout) {
    console.log("lecturerReportController entered");
    $scope.pieIsClicked = false;

    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    var translation = globalSettings.tableTranslation;
    $scope.disabled = true;

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('projectName').withTitle('שם הפרויקט'),
        DTColumnBuilder.newColumn('curStatus').withTitle('שלב'),
        DTColumnBuilder.newColumn('shortDescription').withTitle('תיאור הפרויקט'),
        DTColumnBuilder.newColumn('Department.Name').withTitle('מחלקה')
    ];


    $scope.dtReportsCol = [
        DTColumnBuilder.newColumn('index').withTitle('#'),
        DTColumnBuilder.newColumn('projectName').withTitle('שם הפרויקט'),
        DTColumnBuilder.newColumn('projDescrip').withTitle('תיאור הפרויקט'),
        DTColumnBuilder.newColumn('shortDescription').withTitle('תקציר'),
        DTColumnBuilder.newColumn('students.email').withTitle('שמות הסטודנטים'),
        DTColumnBuilder.newColumn('students.name').withTitle('סטודנטים אימיילים'),
        DTColumnBuilder.newColumn('literatureSources').withTitle('מקורות'),
        DTColumnBuilder.newColumn('lecturers.name').withTitle('מנחים מקצועיים'),
        DTColumnBuilder.newColumn('professionalGuide').withTitle('מרצים'),
        DTColumnBuilder.newColumn('lecturers.email').withTitle('מנחים אימיילים'),
        DTColumnBuilder.newColumn('isPaired').withTitle('מצוות'),
        DTColumnBuilder.newColumn('curStatus').withTitle('שלב'),
        DTColumnBuilder.newColumn('curState.curStage').withTitle('שלב'),
        DTColumnBuilder.newColumn('curState.curOrder').withTitle('מס׳ שלב'),
        DTColumnBuilder.newColumn('waitingApproval').withTitle('מחכה לאישור'),
        DTColumnBuilder.newColumn('Semester.Name').withTitle('סמסטר'),
        DTColumnBuilder.newColumn('Year.Name').withTitle('שנה'),
        DTColumnBuilder.newColumn('College.Name').withTitle('קמפוס'),
        DTColumnBuilder.newColumn('Department.Name').withTitle('מחלקה'),
        DTColumnBuilder.newColumn('Type.Name').withTitle('סוג הפרויקט')
    ];

    var projectsWOFilter = [];

    var sortedProjects = [];
    var archivedProjects = [];
    $scope.archivedProjectsData = archivedProjects;
    $scope.projectsData = sortedProjects;
    $scope.modalState = "";
    $scope.isLoading = false;
    $scope.numOfMyProject = -1;

    Projects.getRequestsByManagerArchive()
    .success(function (data) {       
        archivedProjects = data;
        $scope.archivedProjectsData = archivedProjects;
        $scope.requestsData = data;
    });

    $http.get('/api/lecturer/reports/projects/')
        .success(function (data) {
            sortedProjects = data;
            $scope.projectsData = sortedProjects;
            projectsWOFilter = angular.copy(data);

            $scope.numOfMyProject = data.length;
            resetFilters();
        });
   

    var resetFilters = function () {
        $http.get('/api/manager/project-filters/')
            .success(function (data) {
                //console.log(data);
                $scope.filtersSet = data;
                //console.log($scope.filtersSet);
                $scope.filterApply = {};
                $scope.filterApply.students = [];
                $scope.filterApply.lecturers = [];
                $scope.filterApply.stages = [];
                $scope.filterApply.statuses = [];
                $scope.filterApply.projectflows = [];
                $scope.filterApply.projectsemesters = [];
                $scope.filterApply.projectdepartments = [];
                $scope.filterApply.projectcolleges = [];
                $scope.filterApply.projectyears = [];
                $scope.filterApply.projectName = "";
                $scope.filterApply.projectStage = "";
                $scope.filterApply.projectStatus = "";
                $scope.filterApply.projectFlows = "";
                $scope.filterApply.projectSemesters = "";
                $scope.filterApply.projectDepartments = "";
                $scope.filterApply.projectColleges = "";
                $scope.filterApply.projectYears = "";
            });
    };

    $scope.filterKolKore = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'קול קורא';
        });
    };
    $scope.filterGrouped = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'ניסוח הצעה';
        });
    };
    $scope.filterWaiting = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'ממתין לאישור';
        });
    };
    $scope.filterAction = function () {
        $scope.projectsData = projectsWOFilter.filter(function (proj) {
            return proj.curState.curStatus === 'בביצוע';
        });
    };

    $scope.clearFilter = function () {
        $scope.projectsData = projectsWOFilter;
        resetFilters();
    };

    $scope.filterByName = function filterByName(usersArr, typedValue) {
        var result = usersArr.filter(function (user) {

            var matches_phone = false;
            matches_first_name = user.firstName.indexOf(typedValue) !== -1;
            matches_last_name = user.lastName.indexOf(typedValue) !== -1;

            if (angular.isDefined(user.Phone))
                if (user.Phone !== null)
                    matches_phone = user.Phone.indexOf(typedValue) !== -1;

            return matches_first_name || matches_last_name || matches_phone;
        });
        return result;
    };

    $scope.addFilter = function (ObjType) {

        switch (ObjType) {
            case 'student':
                $scope.filterApply.students.push($scope.filterStudent);
                $scope.filtersSet.students.splice($scope.filtersSet.students.indexOf($scope.filterStudent), 1);
                delete $scope.filterStudent;
                break;
            case 'lecturer':
                $scope.filterApply.lecturers.push($scope.filterLecturer);
                $scope.filtersSet.lecturers.splice($scope.filtersSet.lecturers.indexOf($scope.filterLecturer), 1);
                delete $scope.filterLecturer;
                break;
            default:
        }

    };

    $scope.pickFilter = function (filteredObject, ObjType) {
        switch (ObjType) {
            case 'student':
                $scope.filterStudent = filteredObject;
                break;
            case 'lecturer':
                $scope.filterLecturer = filteredObject;
                break;
            default:
        }
    };

    $scope.removeUserFilter = function (userObj, ObjType) {
        switch (ObjType) {
            case 'student':
                $scope.filterApply.students.splice($scope.filterApply.students.indexOf(userObj), 1);
                $scope.filtersSet.students.push(userObj);
                break;
            case 'lecturer':
                $scope.filterApply.lecturers.splice($scope.filterApply.lecturers.indexOf(userObj), 1);
                $scope.filtersSet.lecturers.push(userObj);
                break;
            default:
        }
    };

    $scope.pieChartShow = function () {
        $scope.pieIsClicked = true;
    };

    $scope.pieChartHide = function () {
        $scope.pieIsClicked = false;
    };

    $scope.barChartShow = function () {
        $scope.barIsClicked = true;
    };

    $scope.barChartHide = function () {
        $scope.barIsClicked = false;
    };
    $scope.changedFlowType = function(data){
        var dataFlow = document.getElementById("filterApply.projectFlows").value;
        var typeFlow;
        switch (dataFlow)
        {
            case "מחקר":
                typeFlow = "research";
            break;
            case "פיתוח":
                typeFlow = "development";
            break;
            case "משולב":            
                typeFlow = "combined";
            break;
            default:
                typeFlow = "research";

        }
        var department = localStorageService.get('userDepartmentSlug');
        
        var collegeSlug = document.getElementById("filterApply.projectColleges").value;

        var college = "default"
        switch (collegeSlug)
        {
            case "SCE באר שבע":
                collegeSlug = "sce-b7";
            break;
            case "SCE אשדוד":
                collegeSlug = "sce-ashdod";
            break;
            default:
                collegeSlug = "sce-b7";

        }

        $http.get('/api/manager/project-filters/'+typeFlow+"/"+department+"/"+collegeSlug)
            .success(function (data) {
                $scope.filtersSet = data;
            });
    }
	
	
	 var excludeStatus = ["קול קורא","ניסוח הצעת פרוייקט למנהל פרוייקטים",
                        "ממתין לאישור מנהל פרוייקטים", "הגשת הפרויקט","פרוייקט שהוצג ועבר בהצלחה",
                        "פרוייקט נכשל"];

    $scope.hideNotInProccess = function(name){
        if(excludeStatus.indexOf(name) !== -1) {
            return true;
        }
        else{
            return false;
        }
    }

    $scope.disabled = true;
    $scope.checkInProccessStatus = function(status){
        if(status == "בביצוע"){
            $scope.disabled = false;
        }
        else
        {
            $scope.disabled = true;
            $scope.filterApply.projectStage = "";
        }
    }

    $http({
        method: 'GET',
        url: '/api/roles'
    }).success(function (result) {
        $scope.roles = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/departments'
    }).success(function (result) {
        if (curUserAuth === 'lecturer' || curUserAuth==='manager')
        {

            $scope.departments = result;
        }
        else if(curUserAuth ==='admin'){

            $scope.departments = result;
        }

        $scope.departments = result;
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
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/colleges'
    }).success(function (result) {
        $scope.colleges = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/user/usernames'
    }).success(function (result) {
        userNames = result;
    });


    /******************************************************************/
    /***********************Watchers***********************************/
    /******************************************************************/

    /*
     * Once filterApply changed, filter the projects list
     */

    $scope.$watch('filterApply', function (newValue) {

            options = DTOptionsBuilder.newOptions()
                .withPaginationType('full_numbers')
                // Active Buttons extension
                .withButtons([
                    'colvis', 'copy', 'excel', 'print', 'colvisRestore',
                    {
                        text: 'יצא הכל (CSV)',
                        key: '1',
                        action: function (e, dt, node, config) {

                            var exportCSV = [];

                            for (var projectObj in $scope.projectsData) {
                                var exportProject = {
                                    nameHeb: "",
                                    nameEng: "",
                                    shortDescription: "",
                                    projDescrip: "",
                                    professionalGuide: "",
                                    neededKnowledge: "",
                                    literatureSources: "",
                                    lecturers: "",
                                    students: "",
                                    type: "",
                                    college: "",
                                    isPaired: "",
                                    waitingApproval: "",
                                    isInProcess: "",
                                    curState: "",
                                    createdDate: "",
                                    creationYear: ""

                                };

                                exportProject.nameHeb = sortedProjects[projectObj].nameHeb;
                                exportProject.nameEng = sortedProjects[projectObj].nameEng;
                                exportProject.shortDescription = sortedProjects[projectObj].shortDescription;
                                exportProject.projDescrip = sortedProjects[projectObj].projDescrip;
                                exportProject.neededKnowledge = sortedProjects[projectObj].neededKnowledge;
                                exportProject.literatureSources = sortedProjects[projectObj].literatureSources;
                                exportProject.professionalGuide = sortedProjects[projectObj].professionalGuide;
                                exportProject.isPaired = sortedProjects[projectObj].isPaired;
                                exportProject.waitingApproval = sortedProjects[projectObj].waitingApproval;
                                exportProject.isInProcess = sortedProjects[projectObj].isInProcess;
                                exportProject.curState = sortedProjects[projectObj].curState.curStage + ' ' + sortedProjects[projectObj].curState.curStatus;
                                exportProject.type = sortedProjects[projectObj].flow.Type.Name;
                                exportProject.college = sortedProjects[projectObj].flow.College.Name;
                                exportProject.createdDate = sortedProjects[projectObj].createdDate;
                                exportProject.creationYear = sortedProjects[projectObj].Year.Name;
                                for (var index in  sortedProjects[projectObj].lecturers) {
                                    exportProject.lecturers += sortedProjects[projectObj].lecturers[index].name + ' ,';
                                }
                                exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                                for (var index in  sortedProjects[projectObj].students) {
                                    exportProject.students += sortedProjects[projectObj].students[index].name + ' ,';
                                }
                                exportProject.students = exportProject.students.substring(0, exportProject.students.length - 1);

                                exportCSV.push(exportProject);
                            }

                            var data = Papa.unparse(exportCSV);

                            data = data.replace("nameHeb", "שם בעברית");
                            data = data.replace("nameEng", "שם באנגלית");
                            data = data.replace("shortDescription", "תקציר");
                            data = data.replace("projDescrip", "תיאור הפרויקט");
                            data = data.replace("neededKnowledge", "ידע נדרש");
                            data = data.replace("literatureSources", "מקורות ספרות");
                            data = data.replace("isPaired", "מצוות");
                            data = data.replace("waitingApproval", "ממתין לאישור");
                            data = data.replace("isInProcess", "בתהליך");
                            data = data.replace("curState", "שלב נוכחי");
                            data = data.replace("type", "סוג הפרויקט");
                            data = data.replace("college", "קמפוס");
                            data = data.replace("createdDate", "תאריך יצירה");
                            data = data.replace("creationYear", "שנה אקדמאית");
                            data = data.replace("lecturers", "מרצים");
                            data = data.replace("students", "סטודנטים");

                            var today = new Date();
                            var dd = today.getDate();
                            var mm = today.getMonth() + 1; //January is 0!

                            var yyyy = today.getFullYear();
                            if (dd < 10) {
                                dd = '0' + dd
                            }
                            if (mm < 10) {
                                mm = '0' + mm
                            }

                            //console.log(data);

                            var hiddenElement = document.createElement('a');
                            hiddenElement.setAttribute("href", "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(data));

                            hiddenElement.target = '_blank';
                            hiddenElement.download = 'דוח פרויקטים ' + dd + '-' + mm + '-' + yyyy + ' ' + today.getHours() + today.getMinutes() + '.csv';
                            hiddenElement.click();

                        }

                    },
                    {
                        text: 'יצא הכל (Excel)',
                        key: '2',
                        action: function (e, dt, node, config) {

                            var exportExcel = [];

                            for (var projectObj in $scope.projectsData) {
                                var exportProject = {
                                    nameHeb: "",
                                    nameEng: "",
                                    shortDescription: "",
                                    projDescrip: "",
                                    professionalGuide: "",
                                    neededKnowledge: "",
                                    literatureSources: "",
                                    lecturers: "",
                                    students: "",
                                    type: "",
                                    college: "",
                                    isPaired: "",
                                    waitingApproval: "",
                                    isInProcess: "",
                                    curState: "",
                                    createdDate: "",
                                    creationYear: ""

                                };

                                exportProject.nameHeb = sortedProjects[projectObj].nameHeb;
                                exportProject.nameEng = sortedProjects[projectObj].nameEng;
                                exportProject.shortDescription = sortedProjects[projectObj].shortDescription;
                                exportProject.projDescrip = sortedProjects[projectObj].projDescrip;
                                exportProject.neededKnowledge = sortedProjects[projectObj].neededKnowledge;
                                exportProject.literatureSources = sortedProjects[projectObj].literatureSources;
                                exportProject.professionalGuide = sortedProjects[projectObj].professionalGuide;
                                exportProject.isPaired = sortedProjects[projectObj].isPaired;
                                exportProject.waitingApproval = sortedProjects[projectObj].waitingApproval;
                                exportProject.isInProcess = sortedProjects[projectObj].isInProcess;
                                exportProject.curState = sortedProjects[projectObj].curState.curStage + ' ' + sortedProjects[projectObj].curState.curStatus;
                                exportProject.type = sortedProjects[projectObj].flow.Type.Name;
                                exportProject.college = sortedProjects[projectObj].flow.College.Name;
                                exportProject.createdDate = sortedProjects[projectObj].createdDate;
                                exportProject.creationYear = sortedProjects[projectObj].Year.Name;
                                for (var index in  sortedProjects[projectObj].lecturers) {
                                    exportProject.lecturers += sortedProjects[projectObj].lecturers[index].name + ' ,';
                                }
                                exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                                for (var index in  sortedProjects[projectObj].students) {
                                    exportProject.students += sortedProjects[projectObj].students[index].name + ' ,';
                                }
                                exportProject.students = exportProject.students.substring(0, exportProject.students.length - 1);

                                exportExcel.push(exportProject);
                            }

                            var data = Papa.unparse(exportExcel);

                            data = data.replace("nameHeb", "שם בעברית");
                            data = data.replace("nameEng", "שם באנגלית");
                            data = data.replace("shortDescription", "תקציר");
                            data = data.replace("projDescrip", "תיאור הפרויקט");
                            data = data.replace("neededKnowledge", "ידע נדרש");
                            data = data.replace("literatureSources", "מקורות ספרות");
                            data = data.replace("isPaired", "מצוות");
                            data = data.replace("waitingApproval", "ממתין לאישור");
                            data = data.replace("isInProcess", "בתהליך");
                            data = data.replace("curState", "שלב נוכחי");
                            data = data.replace("type", "סוג הפרויקט");
                            data = data.replace("college", "קמפוס");
                            data = data.replace("createdDate", "תאריך יצירה");
                            data = data.replace("creationYear", "שנה אקדמאית");
                            data = data.replace("lecturers", "מרצים");
                            data = data.replace("students", "סטודנטים");

                            var today = new Date();
                            var dd = today.getDate();
                            var mm = today.getMonth() + 1; //January is 0!

                            var yyyy = today.getFullYear();
                            if (dd < 10) {
                                dd = '0' + dd
                            }
                            if (mm < 10) {
                                mm = '0' + mm
                            }

                            //console.log(data);

                            var hiddenElement = document.createElement('a');
                            hiddenElement.setAttribute("href", "data:text/excel;charset=utf-8,%EF%BB%BF" + encodeURI(data));

                            hiddenElement.target = '_blank';
                            hiddenElement.download = 'דוח פרויקטים ' + dd + '-' + mm + '-' + yyyy + ' ' + today.getHours() + today.getMinutes() + '.xls';
                            hiddenElement.click();

                        }
                    }])
                .withLanguage(translation)
                .withOption('scrollX', '100%');

            $scope.dtOptionsManagerProjects = options;

            if (typeof newValue !== 'undefined' && typeof $scope.filterApply !== 'undefiend') {

                $scope.isLoading = true;

                $timeout(function () {


                    $scope.projectsData = angular.copy(projectsWOFilter);
                    //console.log(projectsWOFilter); //project data
                    var sortedProjects = angular.copy(projectsWOFilter);

                    var filteredProjects = [];

                    var isPaired = $scope.filterApply.isPaired;
                    var isWaitForApp = $scope.filterApply.waitForApp;

                    //console.log($scope.filterApply);

                    for (var i = 0; i < sortedProjects.length; i++) {
                        /* Lecturers Filter */
                        if ($scope.filterApply.lecturers.length !== 0) {
                            for (var j = 0; j < $scope.filterApply.lecturers.length; j++) {
                                if (sortedProjects[i].lecturers.filter(function (lecturer) {
                                        return $scope.filterApply.lecturers[j]._id === lecturer.id
                                    }).length === 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Students Filter */
                        if ($scope.filterApply.students.length !== 0) {
                            for (var j = 0; j < $scope.filterApply.students.length; j++) {
                                if (sortedProjects[i].students.filter(function (student) {
                                        return $scope.filterApply.students[j]._id === student.id
                                    }).length === 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }

                        /* Project name Filter */
                        if ($scope.filterApply.projectName.length !== 0) {

                            if (angular.isDefined(sortedProjects[i].nameHeb) && angular.isDefined(sortedProjects[i].nameEng)) {
                                if (sortedProjects[i].nameHeb === "") {
                                    if (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0) {
                                        if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                            filteredProjects.push(sortedProjects[i]);
                                        }
                                    }
                                }
                                if (sortedProjects[i].nameEng === "") {
                                    if (sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) {
                                        if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                            filteredProjects.push(sortedProjects[i]);
                                        }
                                    }
                                }
                                if ((sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) && (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0)) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                            else if (!angular.isDefined(sortedProjects[i].nameHeb) && !angular.isDefined(sortedProjects[i].nameEng)) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }

                            }
                            else if (!angular.isDefined(sortedProjects[i].nameHeb)) {
                                if (sortedProjects[i].nameEng.indexOf($scope.filterApply.projectName) < 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                            else if (!angular.isDefined(sortedProjects[i].nameEng)) {
                                if (sortedProjects[i].nameHeb.indexOf($scope.filterApply.projectName) < 0) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }

                        }

                        /* Project stage Filter */
                        if ($scope.filterApply.projectStage.length !== 0) {
                            if (sortedProjects[i].curState.curStage !== $scope.filterApply.projectStage) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project status Filter */
                        if ($scope.filterApply.projectStatus.length !== 0) {
                            if (sortedProjects[i].curState.curStatus !== $scope.filterApply.projectStatus) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project type Filter */
                        if ($scope.filterApply.projectFlows.length !== 0) {
                            if (sortedProjects[i].flow.Type.Name !== $scope.filterApply.projectFlows) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project semester Filter */
                        if ($scope.filterApply.projectSemesters.length !== 0) {
                            if (sortedProjects[i].Semester.Name !== $scope.filterApply.projectSemesters) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project paired Filter*/
                        if (isPaired !== undefined) {
                            if ((isPaired === "true") && (sortedProjects[i].isPaired === false)) { //If you choose Paired ("true").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                            else if ((isPaired === "false") && (sortedProjects[i].isPaired === true)){ //If you choose not Paired ("false").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project approval Filter*/
                        if (isWaitForApp !== undefined) {
                            if ((isWaitForApp === "true") && (sortedProjects[i].waitingApproval === false)) { //If you choose waite for approval ("true").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                            else if ((isWaitForApp === "false") && (sortedProjects[i].waitingApproval === true)){ //If you choose not wait for approval ("false").
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project  Filter */
                        if ($scope.filterApply.projectDepartments.length !== 0) {
                            if (sortedProjects[i].flow.Department.Name !== $scope.filterApply.projectDepartments) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project college Filter */
                        if ($scope.filterApply.projectColleges.length !== 0) {
                            if (sortedProjects[i].flow.College.Name !== $scope.filterApply.projectColleges) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }

                        /* Project year Filter */
                        if ($scope.filterApply.projectYears.length !== 0) {
                            if (sortedProjects[i].Year.Name !== $scope.filterApply.projectYears) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }
                    }

                    for (j = 0; j < filteredProjects.length; j++) {
                        for (i = $scope.projectsData.length - 1; i >= 0; i--) {
                            if ($scope.projectsData[i]._id === filteredProjects[j]._id) {
                                $scope.projectsData.splice(i, 1);
                            }
                        }
                    }

/**********************************************************************************************************************/
/**********************************Start Create Charts*****************************************************************/
/**********************************************************************************************************************/

                    /**********************************Start Line Charts***********************************************/
                    var allLecturers = [];
                    var lectStatCurrentTable = [];
                    var lecturersCurrentTable = [];
                    var statusesAmounts = {kolkore: 0 , nisoah: 0, waitForApp: 0, inProgress: 0, finished: 0};

                    //Get all lecturers in current table.
                    for(i = 0; i < $scope.projectsData.length; i++){
                        if(allLecturers.indexOf($scope.projectsData[i].lecturers[0].name) === -1) {
                            allLecturers[i] = $scope.projectsData[i].lecturers[0].name;
                            if (allLecturers[i] !== undefined){
                                var lec = [allLecturers[i], {kolkore: 0 , nisoah: 0, waitForApp: 0, inProgress: 0, finished: 0}];
                                lectStatCurrentTable.push(lec);
                                lecturersCurrentTable.push(lec[0]);
                            }
                        }
                    }

                    $scope.series = ['קול קורא', 'ניסוח הצעה', 'ממתין לאישור', 'בביצוע', 'פרויקט גמור'];

                    //Calculate each lecturer amount of statuses.
                    for(i = 0; i < $scope.projectsData.length; i++){
                        //Get all statuses amounts
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[0]) { //אם הפרויקט בסטטוס קול קורא
                            statusesAmounts.kolkore++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[1]) { //אם הפרויקט בסטטוס ניסוח הצעה
                            statusesAmounts.nisoah++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[2]) { //אם הפרויקט בסטטוס ממתין לאישור
                            statusesAmounts.waitForApp++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[3]) { //אם הפרויקט בסטטוס בביצוע
                            statusesAmounts.inProgress++;
                        }
                        if ($scope.projectsData[i].curState.curStatus === $scope.series[4]) { //אם הפרויקט בסטטוס פרויקט גמור
                            statusesAmounts.finished++;
                        }
                        //Get all statuses amounts per lecturer
                        for(j = 0; j < $scope.projectsData[i].lecturers.length; j++){
                            for(k = 0; k < lectStatCurrentTable.length; k++) {
                                if ($scope.projectsData[i].lecturers[j].name === lectStatCurrentTable[k][0]) {
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[0]) { //אם הפרויקט בסטטוס קול קורא עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].kolkore++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[1]) { //אם הפרויקט בסטטוס ניסוח הצעה עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].nisoah++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[2]) { //אם הפרויקט בסטטוס ממתין לאישור עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].waitForApp++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[3]) { //אם הפרויקט בסטטוס בביצוע עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].inProgress++;
                                    }
                                    if ($scope.projectsData[i].curState.curStatus === $scope.series[4]) { //אם הפרויקט בסטטוס פרויקט גמור עבור מרצה מסויים
                                        lectStatCurrentTable[k][1].finished++;
                                    }
                                }
                            }
                        }
                    }
                    //console.log(lectStatCurrentTable[0][1].kolkore);

                    //Put lecturers to table labels.
                    $scope.labels = [];
                    for(i = 0; i < lecturersCurrentTable.length; i++) {
                        $scope.labels.push(lecturersCurrentTable[i]);
                    }

                    //Put lecturers amount of statuses into chart.
                    $scope.data = [];
                    for(i = 0; i < 1; i++) {
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[0].push(lectStatCurrentTable[j][1].kolkore);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[1].push(lectStatCurrentTable[j][1].nisoah);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[2].push(lectStatCurrentTable[j][1].waitForApp);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[3].push(lectStatCurrentTable[j][1].inProgress);
                        }
                        $scope.data.push([]);
                        for(j = 0; j < lectStatCurrentTable.length; j++) {
                            $scope.data[4].push(lectStatCurrentTable[j][1].finished);
                        }
                    }
                    //console.log($scope.data);

                    $scope.onClick = function (points, evt) {
                        console.log(points, evt);
                    };
                    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
                    $scope.options = {
                        legend: { display: true },
                        scales: {
                            yAxes: [
                                {
                                    id: 'y-axis-1',
                                    type: 'linear',
                                    display: true,
                                    position: 'left'
                                }
                            ]
                        }
                    };

                    /**********************************Start Pie Charts***********************************************/

                    var allStatuses = statusesAmounts.kolkore + statusesAmounts.nisoah + statusesAmounts.waitForApp + statusesAmounts.inProgress + statusesAmounts.finished;
                    var kolKorePerc = (statusesAmounts.kolkore / allStatuses) * 100;
                    var nisoahPerc = (statusesAmounts.nisoah / allStatuses) * 100;
                    var waitForAppPerc = (statusesAmounts.waitForApp / allStatuses) * 100;
                    var inProgressPerc = (statusesAmounts.inProgress / allStatuses) * 100;
                    var finishedPerc = (statusesAmounts.finished / allStatuses) * 100;
                    kolKorePerc= Math.floor(kolKorePerc);
                    nisoahPerc= Math.floor(nisoahPerc);
                    waitForAppPerc= Math.floor(waitForAppPerc);
                    inProgressPerc= Math.floor(inProgressPerc);
                    finishedPerc= Math.floor(finishedPerc);

                    $scope.labels2 = ['קול קורא', 'ניסוח הצעה', 'ממתין לאישור', 'בביצוע', 'פרויקט גמור'];
                    $scope.data2 = [kolKorePerc, nisoahPerc, waitForAppPerc, inProgressPerc, finishedPerc];


                    $scope.options2 = {
                        legend: { display: true }
                    };
/**********************************************************************************************************************/
/**********************************End Create Charts*******************************************************************/
/**********************************************************************************************************************/

                    $scope.isLoading = false;
                }, 1000);
            }
        }
        , true);

});

angular.module("FPM").controller('managerUsersController', function ($scope, $window, $http, Users, localStorageService, DataTablesOptions, globalSettings,$timeout,$location) {


    console.log("managerUsersController entered")
    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.dtOptionsManagerUsers = DataTablesOptions.GlobalOptionsManager();


    $scope.usersDataList = [];
    var allUsers = [];

    /*
     * User details from session in order to use them in server queries
     */


    $http.get('/api/manager/users/')
        .success(function (data) {
            $scope.usersDataList = data;
            allUsers = data;
            $scope.numOfKolKore = data.filter(function (user) {
                return (!user.inGroup && !user.inProcess);
            }).length;
            $scope.numOfWaiting = data.filter(function (user) {
                return (user.inGroup && !user.inProcess);
            }).length;
            $scope.numOfProccess = data.filter(function (user) {
                return (user.inGroup && user.inProcess);
            }).length;
        });

    $scope.filterKolKore = function () {
        $scope.usersDataList = allUsers.filter(function (user) {
            return (!user.inGroup && !user.inProcess);
        });
    };
    $scope.filterWaiting = function () {
        $scope.usersDataList = allUsers.filter(function (user) {
            return (user.inGroup && !user.inProcess);
        });
    };
    $scope.filterAction = function () {
        $scope.usersDataList = allUsers.filter(function (user) {
            return (user.inGroup && user.inProcess);
        });
    };

    $scope.clearFilter = function () {
        $scope.usersDataList = allUsers;
    };

    $scope.resendPassword = function (userEmail) {
        Users.resendPassword(userEmail).success(function (data) {

            toastr.success("לינק לאיפוס נשלח למשתמש", globalSettings.toastrOpts);

        });
    }
    var _userId;
    $scope.showDeleteModal = function(userId){
        jQuery('#modal-delete-user').modal('show');
        _userId = userId;
    }
    $scope.deleteUserByManager = function(){
        $http.get('/api/manager/delete/user/'+_userId)
        .success(function (data) {
            jQuery('#modal-delete-user').modal('hide');
            if(typeof data.lecturer !== "undefined"){
                jQuery('#modal-cannot-delete-lecturer').modal('show');
            }
            else if(typeof data.student !== "undefined")
            {
                jQuery('#modal-cannot-delete-student').modal('show');
            }
            else{
                toastr.success("משתמש נמחק בהצלחה", globalSettings.toastrOpts);
                $timeout(function() {
                    if(curUserAuth == "manager"){
                        $location.path("/account/manager");
                    }
                    else {
                        $location.path("/account/admin");
                    }
                    
                }, 2000);
            }
        });
    };

});
angular.module("FPM").controller('managerReportUngroupedStudentsController', function ($scope, $window, $http, localStorageService, DataTablesOptions) {

    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.dtOptionsManagerUsers = DataTablesOptions.GlobalOptionsManager();


    $scope.usersDataList = [];
    var allUsers = [];

    /*
     * User details from session in order to use them in server queries
     */

    var curUserID = localStorageService.get('userId');

    $http.get('/api/manager/users/student/ungroupped')
        .success(function (data) {
            $scope.usersDataList = data;
            allUsers = data;
            $scope.numOfKolKore = data.filter(function (user) {
                return (!user.inGroup && !user.inProcess);
            }).length;
            $scope.numOfWaiting = data.filter(function (user) {
                return (user.inGroup && !user.inProcess);
            }).length;
            $scope.numOfProccess = data.filter(function (user) {
                return (user.inGroup && user.inProcess);
            }).length;
        });
});
angular.module("FPM").controller('managerReportWOProjectLecturersController', function ($scope, $window, $http, localStorageService, DataTablesOptions) {

    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    $scope.dtOptionsManagerUsers = DataTablesOptions.GlobalOptionsManager();


    $scope.usersDataList = [];
    var allUsers = [];

    /*
     * User details from session in order to use them in server queries
     */

    var curUserID = localStorageService.get('userId');

    $http.get('/api/manager/users/lecturer/unopened/')
        .success(function (data) {
            $scope.usersDataList = data;

        });
});
angular.module("FPM").controller('managerUsersImportController', function ($scope, $http, globalSettings, localStorageService) {

    var curUserAuth = localStorageService.get('userRoleSlug');
    if(curUserAuth === 'lecturer' || curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/login');

    }

    var data;

    $scope.uploadCSV = function () {
        var file = $scope.csvFile;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                data = results;
                if (data) {
                    console.log(data.data);
                    $http.post('/api/users/import', data.data)
                        .then(function mySuccess(data) {
                            toastr.success("הקובץ הועלה בהצלחה", globalSettings.toastrOpts);
                            $scope.csvFile = "";

                        }, function myError(data) {
                            if(data.data === "email field is empty") {
                                toastr.error("הקובץ לא הועלה, שדה אימייל ריק!", globalSettings.toastrOpts);
                                console.log(": " + data.data);
                            }
                            if(data.data.msg === "Account with that user name already exists.") {
                                toastr.error("הקובץ לא הועלה, המשתמש " + data.data.Username + " כבר קיים!", globalSettings.toastrOpts);
                                console.log(": " + data.data);
                            }
                            $scope.csvFile = "";
                        });
                }
            }
        });
    };

    $scope.downloadTemplate = function () {
            window.open('/api/users/import/download');
    }

});
