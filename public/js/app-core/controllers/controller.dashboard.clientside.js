angular.module("FPM").controller('dashboardController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,Projects,globalSettings) {


    $scope.projectsData = [];
    var allProjects = [];

    var archivedProjects = [];
    $scope.archivedProjectsData = archivedProjects;

    $scope.isShowArchive = false;
    $scope.numOfMyProject = -1;
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

    Projects.getRequestsByManagerArchive()
    .success(function (data) {       
        archivedProjects = data;   
        $scope.archivedProjectsData = archivedProjects;
        $scope.requestsData = data;

        $scope.numOfArchives = data.length;
    });

    var checkedProjects = [];   
    var lecturerProjects = function(){
        $http.get('/api/lecturer/projects/')
        .success(function (data) {
            $scope.projectsData = data;
            allProjects = data;
            $scope.numOfMyProject = data.length;
            $scope.numOfKolKore = data.filter(function (proj) {
                return proj.curState.curStatus == 'קול קורא';
            }).length;
            $scope.numOfWaiting = data.filter(function (proj) {
                return proj.curState.curStatus == 'ממתין לאישור';
            }).length;
            $scope.numOfProccess = data.filter(function (proj) {
                return proj.curState.curStatus == 'בביצוע';
            }).length;
            $scope.numOfGrouped = data.filter(function (proj) {
                return proj.curState.curStatus == 'ניסוח הצעה';
            }).length;
        });
    } 
    lecturerProjects();
   
    $scope.checkedItems  = function(event,proj){
        if(event.currentTarget.checked == true){
            Projects.updateProjectsStatus(proj._id)
            .success(function(data){
                toastr.success("הבקשה נשלחה בהצלחה", globalSettings.toastrOpts);      
            }).then(function(){
                lecturerProjects();               
            });
        }
        else{
            Projects.uncheckProjectsStatus(proj._id)
            .success(function(data){
                toastr.success(" סטטוס עודכן בהצלחה", globalSettings.toastrOpts);      
            }).then(function(){
                lecturerProjects();               
            });
        }
    }

    $scope.setStageColor = function(index, curOrder){     
        if(index == curOrder || index == curOrder + 1){            
            return {"background-color":"#ffbf00"};
        }
        else if(index < curOrder){
            return {"background-color":"#007f00"};
        }
        else if(index > curOrder){
            return {"background-color":"#d3d3d3"};
        }
    }
    
    $scope.setCheckedProjStatus = function(index, curOrder){     
        if(index == curOrder || index < curOrder){            
            return true;
        }
        else 
            return false;
    }

    $scope.disableStatus = function(index, curOrder){
        if(index == curOrder + 1 || index == curOrder){           
            return false;
        }
        else 
        {
            return true;
        }
        
    }

    $scope.filterKolKore = function () {
        $scope.isShowArchive = false;
        $scope.projectsData = allProjects.filter(function (proj) {
            return proj.curState.curStatus == 'קול קורא';
        });
    }
    $scope.filterGrouped = function () {
        $scope.isShowArchive = false;
        $scope.projectsData = allProjects.filter(function (proj) {
            return proj.curState.curStatus == 'ניסוח הצעה';
        });
    }
    $scope.filterWaiting = function () {
        $scope.isShowArchive = false;
        $scope.projectsData = allProjects.filter(function (proj) {
            return proj.curState.curStatus == 'ממתין לאישור';
        });
    }
    $scope.filterAction = function () {
        $scope.isShowArchive = false;
        $scope.projectsData = allProjects.filter(function (proj) {
            return proj.curState.curStatus == 'בביצוע';
        });
    }

    $scope.filterArchive = function () {
        $scope.isShowArchive = true;
        $scope.projectsData = archivedProjects;
    };

});