angular.module("FPM").controller('headerController', ['$rootScope', '$scope', 'localStorageService', '$location', function ($rootScope, $scope, localStorageService, $location) {

    $rootScope.$on('userLoggedIn', function (event, data) {
        if (localStorageService.get('userRoleSlug')) {
            $scope.userPersonalNameHead = localStorageService.get('userPersonalName');
            $scope.userRoleHead = localStorageService.get('userRole');
            $scope.userCampusHead = localStorageService.get('userCampus');
            $scope.userDepartmentHead = localStorageService.get('userDepartment');

            var userRoleSlug = localStorageService.get('userRoleSlug');

            $scope.isLecturer = (userRoleSlug === "lecturer");
            $scope.isStudent = (userRoleSlug === "student");
            $scope.isManager = (userRoleSlug === "manager");
            $scope.isAdmin= (userRoleSlug === "admin");


        }
    });

    if (localStorageService.get('userRoleSlug')) {
        $scope.userPersonalNameHead = localStorageService.get('userPersonalName');
        $scope.userRoleHead = localStorageService.get('userRole');
        $scope.userCampusHead = localStorageService.get('userCampus');
        $scope.userDepartmentHead = localStorageService.get('userDepartment');

        var userRoleSlug = localStorageService.get('userRoleSlug');

        $scope.isLecturer = (userRoleSlug === "lecturer");
        $scope.isStudent = (userRoleSlug === "student");
        $scope.isManager = (userRoleSlug === "manager");
        $scope.isAdmin= (userRoleSlug === "admin");


    }

    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    /*$scope.$watch(function () {
     return AuthenticationFactory.isLogged;
     },
     function (value) {

     $scope.userPersonalNameHead = localStorageService.get('userPersonalName');
     $scope.userEmailHead = localStorageService.get('userEmail');
     $scope.userDepartmentHead = localStorageService.get('userDepartmentHeb');
     $scope.isLoggedHead = localStorageService.get('isLogged');
     $scope.userRoleNameHead = localStorageService.get('userRoleHeb');
     $scope.userRoleNameSlug = localStorageService.get('userRole');

     $scope.isLecturer = ($scope.userRoleNameSlug == "lecturer");
     $scope.isStudent = ($scope.userRoleNameSlug == "student");
     $scope.isManager = ($scope.userRoleNameSlug == "manager");


     }
     );*/

    /*var path = "/account/manager/projects";
     $scope.isActive = function (viewLocation) {

     return viewLocation === $location.path();
     };*/

    /*
     * Get notifications in order to add to project.
     * If new project - loading all students.
     */
    /*$http({
     method: 'GET',
     url: '/api/getnotifications/byproject/' + curProjectID,
     }).then(function (result) {
     console.log(result)
     $scope.notifications = result.data;
     });*/
}]);
