angular.module("FPM").controller('dashboardArchiveAllProjectsController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,Upload) {

    $scope.projectsData = [];

    var archivedProjects = [];
    $scope.archivedProjectsData = archivedProjects;

    /*
     * User details from session in order to use them in server queries
     */

    var curUserID = localStorageService.get('userId');
    var curUserAuth = localStorageService.get('userRoleSlug');

    //check user permissions
    if(curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/Login');

    }

    $scope.pieIsClicked = false;

    var curUserAuth = localStorageService.get('userRoleSlug');

    var translation = globalSettings.tableTranslation;
    $scope.disabled = true;

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('projectName').withTitle('שם הפרויקט'),
        DTColumnBuilder.newColumn('curStatus').withTitle('סטטוס'),
        DTColumnBuilder.newColumn('shortDescription').withTitle('תיאור הפרויקט'),
        DTColumnBuilder.newColumn('Department.Name').withTitle('מחלקה'),
        DTColumnBuilder.newColumn('Archive.File.Upload').withTitle('העלאת קובץ PDF')
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
        DTColumnBuilder.newColumn('curStatus').withTitle('סטטוס'),
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

    $scope.projectData={};
    $scope.isPreview = true;
    $scope.curFile = {};
    $scope.downloadPdf = function(obj){
        obj.documentation="file-1522618695706.pdf";
        $http.get('api/download/archive/'+obj.documentation)
        .success(function(){
            window.open('api/download/archive/'+obj.documentation)
        });
    }
  
    $scope.upload = function (file) {

        Upload.upload({
            url: '/upload', //webAPI exposed to upload the file
            data: {file: file} //pass file as data, should be user ng-model
        }).then(function (resp) { //upload function returns a promise
            if (resp.data.error_code === 0) { //validate success
                var filePath = resp.data.data;
                //filePath = filePath.replace('C:\\Users\\Administrator\\WebstormProjects\\FPM-AngularJS\\public\\', '');
                filePath = filePath.replace('\\Users\\vitaly\\Desktop\\RonenMars-nodefpm-ace6640c93ef\\public\\', '');
                console.log(filePath);
                $scope.projectData.picUrl = filePath;
                $scope.isPreview = false;

                toastr.success("הקובץ עלה בהצלחה", globalSettings.toastrOpts);

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
    $scope.submFile = function (file, err) { 
      //function to call on form submit
      if(err.length > 0){
        $window.alert('an error occured');
      }
      else{
        $scope.upload(file);
      }
    
    };

    $http.get('api/projects/all/archive/')
        .success(function (data) {
            sortedProjects = data;
            $scope.projectsData = sortedProjects;
            projectsWOFilter = angular.copy(data);
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

    $http({
        method: 'GET',
        url: '/api/roles/archive'
    }).success(function (result) {
        $scope.roles = result;
    });
    /*
     * Loading all existing departments to form
     */
    $http({
        method: 'GET',
        url: '/api/departments/archive'
    }).success(function (result) {
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
        url: '/api/colleges/archive'
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
                        try{
                        if ($scope.filterApply.projectStage.length !== 0) {
                            if (sortedProjects[i].curState.curStage !== $scope.filterApply.projectStage) {
                                if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                    filteredProjects.push(sortedProjects[i]);
                                }
                            }
                        }
                    }
                    catch(e){console.log(e)}

                        /* Project status Filter */
                        try{
                            if ($scope.filterApply.projectStatus.length !== 0) {
                                if (sortedProjects[i].curState.curStatus !== $scope.filterApply.projectStatus) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}

                        /* Project type Filter */
                        try{
                            if ($scope.filterApply.projectFlows.length !== 0) {
                                if (sortedProjects[i].flow.Type.Name !== $scope.filterApply.projectFlows) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}

                        /* Project semester Filter */
                        try{
                            if ($scope.filterApply.projectSemesters.length !== 0) {
                                if (sortedProjects[i].Semester.Name !== $scope.filterApply.projectSemesters) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}

                        /* Project  Filter */
                        try{
                            if ($scope.filterApply.projectDepartments.length !== 0) {
                                if (sortedProjects[i].flow.Department.Name !== $scope.filterApply.projectDepartments) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}

                        /* Project college Filter */
                        try{
                            if ($scope.filterApply.projectColleges.length !== 0) {
                                if (sortedProjects[i].flow.College.Name !== $scope.filterApply.projectColleges) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}

                        /* Project year Filter */
                        try{
                            if ($scope.filterApply.projectYears.length !== 0) {
                                if (sortedProjects[i].Year.Name !== $scope.filterApply.projectYears) {
                                    if (filteredProjects.indexOf(sortedProjects[i]) < 0) {
                                        filteredProjects.push(sortedProjects[i]);
                                    }
                                }
                            }
                        }
                        catch(e){console.log(e)}
                    }

                    for (j = 0; j < filteredProjects.length; j++) {
                        for (i = $scope.projectsData.length - 1; i >= 0; i--) {
                            if ($scope.projectsData[i]._id === filteredProjects[j]._id) {
                                $scope.projectsData.splice(i, 1);
                            }
                        }
                    }

                    $scope.isLoading = false;
                }, 1000);
            }
        }
        , true);
});