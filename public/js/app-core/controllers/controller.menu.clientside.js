angular.module("FPM").controller('menuController', ['$scope', 'localStorageService', 'AuthenticationFactory', function ($scope, localStorageService, AuthenticationFactory) {
    $scope.$watch(function () {
            return AuthenticationFactory.isLogged;
        },
        function (value) {
            $scope.userRoleNameSlug = localStorageService.get('userRole');
            if($scope.userRoleNameSlug === "lecturer") {
                $scope.isLecturer = ($scope.userRoleNameSlug == "lecturer");
            }
            if($scope.userRoleNameSlug === "student") {
                $scope.isStudent = ($scope.userRoleNameSlug == "student");
            }
            if($scope.userRoleNameSlug === "student") {
                $scope.isManager = ($scope.userRoleNameSlug == "manager");
            }
        }
    );
}]);
