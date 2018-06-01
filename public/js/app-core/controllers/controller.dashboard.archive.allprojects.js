angular.module("FPM").controller('dashboardArchiveAllProjectsController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,DataTablesOptions) {

    console.log("dashboardArchiveAllProjectsController entered")
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
    $scope.dtOptionsManagerRequests = DataTablesOptions.GlobalOptionsManager();

    $scope.checkIfPdfExists = function(data){
        if(data.Documentation  && data.Documentation != 'undefined'){
            return true;
        }
        else{
            return false;
        }
    }

    $scope.pieIsClicked = false;

    var curUserAuth = localStorageService.get('userRoleSlug');

    var translation = globalSettings.tableTranslation;
    $scope.disabled = true;


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
        $http.get('api/download/archive/'+obj.Documentation)
        .success(function(data){
            window.open('api/download/archive/'+obj.Documentation)           
        });
    }
    $scope.downloadAllPdfs = function(project){
        var arrProj = [];
        for(var i in project){
           if(project[i].selected=='Y'){
               if(typeof project[i].Documentation !== 'undefined' && project[i].Documentation !== null){
                arrProj.push(project[i].Documentation)
               }           
           }
        }
        if(arrProj.length > 0){
            $http.get('api/import/archive/all/'+arrProj)
            .then(function(data){   
                if(data.status == 200){
                    $timeout(function() { window.open('/api/users/download/archives');}, 500); 
                }
               else{
                alert("אירעה שגיאה ביצירת קובץ זיפ");
               }               
            });
        }
    }
    $scope.checkall = false;
    $scope.toggleAll = function() {
      $scope.checkall = !$scope.checkall;
      for(var key in $scope.projectsData) {
          if($scope.checkall == true){
            $scope.projectsData[key].selected = true;
            $scope.projectsData[key].selected = 'Y';
          }
          else{
            $scope.projectsData[key].selected = false;
            $scope.projectsData[key].selected = 'N'; 
          }
       
      }
    }

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

        $scope.checkall = true;
        $scope.toggleAll();

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
                            creationYear: "",
                            semester:""

                        };

                        exportProject.nameHeb = $scope.projectsData[projectObj].nameHeb;
                        exportProject.nameEng = $scope.projectsData[projectObj].nameEng;
                        exportProject.shortDescription = $scope.projectsData[projectObj].shortDescription;
                        exportProject.projDescrip = $scope.projectsData[projectObj].projDescrip;
                        exportProject.neededKnowledge = $scope.projectsData[projectObj].neededKnowledge;
                        exportProject.literatureSources = $scope.projectsData[projectObj].literatureSources;
                        exportProject.professionalGuide = $scope.projectsData[projectObj].professionalGuide;
                        exportProject.isPaired = $scope.projectsData[projectObj].isPaired== true ? "כן" : "לא";
                        exportProject.waitingApproval = $scope.projectsData[projectObj].waitingApproval== true ? "כן" : "לא";
                        exportProject.isInProcess = $scope.projectsData[projectObj].isInProcess== true ? "כן" : "לא";
                        exportProject.curState = $scope.projectsData[projectObj].curState.curStage + ' ' + $scope.projectsData[projectObj].curState.curStatus;
                        exportProject.type = $scope.projectsData[projectObj].flow.Type.Name;
                        exportProject.college = $scope.projectsData[projectObj].flow.College.Name;
                        exportProject.createdDate = $scope.projectsData[projectObj].createdDate;
                        exportProject.creationYear = $scope.projectsData[projectObj].Year.Name;
                        exportProject.semester = $scope.projectsData[projectObj].Semester.Name;
                        for (var index in  $scope.projectsData[projectObj].lecturers) {
                            exportProject.lecturers += $scope.projectsData[projectObj].lecturers[index].name + ' ,';
                        }
                        exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                        for (var index in  $scope.projectsData[projectObj].students) {
                            exportProject.students += $scope.projectsData[projectObj].students[index].name + ' ,';
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
                    data = data.replace("semester", "סמסטר");

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
                            creationYear: "",
                            semester:""

                        };

                        exportProject.nameHeb = $scope.projectsData[projectObj].nameHeb;
                        exportProject.nameEng = $scope.projectsData[projectObj].nameEng;
                        exportProject.shortDescription = $scope.projectsData[projectObj].shortDescription;
                        exportProject.projDescrip = $scope.projectsData[projectObj].projDescrip;
                        exportProject.neededKnowledge = $scope.projectsData[projectObj].neededKnowledge;
                        exportProject.literatureSources = $scope.projectsData[projectObj].literatureSources;
                        exportProject.professionalGuide = $scope.projectsData[projectObj].professionalGuide;
                        exportProject.isPaired = $scope.projectsData[projectObj].isPaired == true ? "כן" : "לא";
                        exportProject.waitingApproval = $scope.projectsData[projectObj].waitingApproval== true ? "כן" : "לא";
                        exportProject.isInProcess = $scope.projectsData[projectObj].isInProcess== true ? "כן" : "לא";
                        exportProject.curState = $scope.projectsData[projectObj].curState.curStage + ' ' + $scope.projectsData[projectObj].curState.curStatus;
                        exportProject.type = $scope.projectsData[projectObj].flow.Type.Name;
                        exportProject.college = $scope.projectsData[projectObj].flow.College.Name;
                        exportProject.createdDate = $scope.projectsData[projectObj].createdDate;
                        exportProject.creationYear = $scope.projectsData[projectObj].Year.Name;
                        exportProject.semester = $scope.projectsData[projectObj].Semester.Name;
                        for (var index in  $scope.projectsData[projectObj].lecturers) {
                            exportProject.lecturers += $scope.projectsData[projectObj].lecturers[index].name + ' ,';
                        }
                        exportProject.lecturers = exportProject.lecturers.substring(0, exportProject.lecturers.length - 1);

                        for (var index in  $scope.projectsData[projectObj].students) {
                            exportProject.students += $scope.projectsData[projectObj].students[index].name + ' ,';
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
                    data = data.replace("semester", "סמסטר");

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