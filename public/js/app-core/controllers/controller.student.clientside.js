angular.module("FPM").controller('studentController', function ($scope, $http, Projects, localStorageService) {
    console.log("studentController entered");

    $scope.filterLecturers = [];
    $scope.filterKeys = [];
    $scope.filterTags = [];
    $scope.filter = {
        lecturers: [],
        tags: []
    };


    var curUserDepartment = localStorageService.get('userDepartment');

    var curUserCollege = localStorageService.get('userCollege');

    var inGroup = false;


    $http({
        method: 'GET',
        url: '/api/lecturers/for-project/'
    }).then(function (result) {
        $scope.lecturers = result.data;
    });

    $http({
        method: 'GET',
        url: '/api/tags/for-project/texts/',
    }).then(function (result) {
        $scope.tags = result.data;
    });

    $http({
        method: 'GET',
        url: '/api/projects/filter',
    }).success(function (result) {
        $scope.projects = result;
    });

    $http({
        method: 'GET',
        url: '/api/student/projects',
    }).success(function (result) {       
        $scope.studentProjects = result;
    });


    var filterLec = function (action, id) {
        if (action === 'add' && $scope.filterLecturers.indexOf(id) === -1) {
            $scope.filterLecturers.push(id);
        }
        if (action === 'remove' && $scope.filterLecturers.indexOf(id) !== -1) {
            $scope.filterLecturers.splice($scope.filterLecturers.indexOf(id), 1);
        }

        filterNow();
    };

    $scope.updateSelection = function ($event, lec) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        filterLec(action, lec);
    };

    $scope.inGroup = false;

    var filterNow = function () {
        if ($scope.filterLecturers.length != 0)
            Projects.filterProjects($scope.filterLecturers, inGroup, curUserDepartment).success(function (projData) {
                $scope.projects = projData;
            });

        else {
            $http({
                method: 'GET',
                url: '/api/projects/filter',
            }).success(function (result) {
                $scope.projects = result;
            });
        }
    };

          /*
     * Loading all existing keys to form to form
     */
    $http({
        method: 'GET',
        url: '/api/projects/keys'
    }).success(function (result) {
        $scope.projectkeys = result;
    });



    var filterKey = function (action, key) {
        if (action === 'add' && $scope.filterKeys.indexOf(key.Name) === -1) {
            $scope.filterKeys.push(key.Name);
        }
        if (action === 'remove' && $scope.filterKeys.indexOf(key.Name) !== -1) {
            $scope.filterKeys.splice($scope.filterKeys.indexOf(key.Name), 1);
        }

        filterNowKey($scope.filterKeys);
    };

    $scope.updateSelectionKey = function ($event, key) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        filterKey(action, key);
    };

    var arrKeys = [];
    var filterNowKey = function (keyVal) {
        if ($scope.filterKeys.length != 0){ 
            Projects.filterProjectsKey($scope.filterKeys, inGroup, curUserDepartment).success(function (projData) {
                $scope.projects = projData;
            });
        }
        else if($scope.filterLecturers.length != 0 && $scope.filterKeys.length != 0){
            for(var j = 0; j<keyVal.length;j++){
                for(var i = 0;i<$scope.projects.length;i++){
                    if(typeof $scope.projects[i].Key !== 'undefined'){
                        if($scope.projects[i].Key.Name == keyVal[j]){
                            arrKeys.push($scope.projects[i])
                        }
                    }
                }
            }
          
            $scope.projects = arrKeys;
            arrKeys = [];
        }
        else if ($scope.filterLecturers.length != 0){
            Projects.filterProjects($scope.filterLecturers, inGroup, curUserDepartment).success(function (projData) {
                $scope.projects = projData;
            });
        }
        else {
            $http({
                method: 'GET',
                url: '/api/projects/filter',
            }).success(function (result) {
                $scope.projects = result;
            });
        }
    };

});
angular.module("FPM").controller('studentViewProjectController', function ($scope, $http, $location, $window, $rootScope, Projects, localStorageService, $routeParams, $filter,globalSettings) {


    /******************************************************************/
    /************************On Page Load******************************/
    /******************************************************************/
    /*
     * Local variables
     */

    $scope.lecturers = [];
    $scope.selectedLecturer = [];
    $scope.selectedStudent1 = "";
    $scope.colleges = [];
    $scope.myFiles = [];
    $scope.curFlow = [];
    $scope.ApprovalSend = false;
    $scope.data = {};

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
    var curUserDepartment = localStorageService.get('userDepartment');
    var curUserCollege = localStorageService.get('userCollege');
    var curUserRole = localStorageService.get('userRole');
    var curProjectID = $routeParams.projectId;


    /*
     * User details from session in order to use them in server queries
     */
    var curUserEmail = localStorageService.get('userEmail');
    var curUserName = localStorageService.get('userPersonalName');
    var curUserID = localStorageService.get('userId');


    /*
     * Project data loading into a local object
     * Also we loading project types out of another
     * collection in case we will need to change projects type.
     * */
    if ($scope.projectData._id != null) {
        Projects.getSingle($scope.projectData._id)
            .success(function (projData) {
                initProcess = true;
                $scope.projectData = projData;
                $scope.data.currentCollege = projData.flow.College.Slug;
                $scope.data.currentType = $scope.projectData.flow.Type.Slug;
                $scope.PageMode = 'edit';
                if (projData.picUrl != "")
                    $scope.isPreview = false;

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
            url: 'api/users/for-project/lecturer',
        }).success(function (result) {
            $scope.lecturers = result;

            /*
             * Adding lecturer who opened the page to project
             */
            var addedLecturer = {
                id: curUserID,
                name: curUserName,
                email: curUserEmail
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


        /*
         * Get students in order to add to project.
         * Loading only students who wasn't added to current project.
         * If new project - loading all students.
         */
        $http({
            method: 'GET',
            url: 'api/users/for-project/student',
        }).success(function (result) {
            $scope.students = result;
        });
    }


    $scope.sendInterest = function () {
        $scope.emailData = {
            Eexplain: $scope.explain,
            EmoreStudents: $scope.moreStudents,
            projectId: $scope.projectData._id
             }

        $http.post('/api/interest', $scope.emailData)
            .success(function (data) {
                $scope.show1 = false;
                $scope.explain = "";
                $scope.moreStudents = "";


                    toastr.success("הבקשה נשלחה בהצלחה", globalSettings.toastrOpts);

            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };


});
angular.module("FPM").controller('studentWaitingController', function ($scope, localStorageService, $http) {

    var curUserID = localStorageService.get('userId');
    var a = document.getElementById('isShowStudent'); //or grab it by tagname etc

    a.href = "/#/account/student/waiting";

    $scope.projectData = {}
    /*
     * Project data loading into a local object
     * */
    $http.get('/api/project/getbystudent/' + curUserID).success(function (userProject) {
        $scope.projectData = userProject;
    });

});