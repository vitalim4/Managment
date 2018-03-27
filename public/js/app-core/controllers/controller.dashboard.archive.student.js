angular.module("FPM").controller('dashboardArchiveAllStudentProjectsController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,Projects,globalSettings) {


    console.log("dashboardArchiveAllStudentProjectsController entered")
    $scope.projectsData = [];

    var archivedProjects = [];
    $scope.archivedProjectsData = archivedProjects;

    /*
     * User details from session in order to use them in server queries
     */

    var curUserID = localStorageService.get('userId');
    var curUserAuth = localStorageService.get('userRoleSlug');

    //check user permissions
    /*if(curUserAuth === 'student'){

        localStorageService.clearAll();
        $http.get('/logout');
        $location.url('/Login');

    }*/
    
    Projects.getRequestsByManagerArchive()
    .success(function (data) {       
        archivedProjects = data;   
        $scope.archivedProjectsData = archivedProjects;
        $scope.requestsData = data;
    });
});