angular.module("FPM").controller('LoginController', ['$rootScope', '$scope', '$http', '$location', 'localStorageService','globalSettings',
    function ($rootScope, $scope, $http, $location, localStorageService,globalSettings) {

        $scope.login = function () {

            var shaObj = new jsSHA("SHA-256", "TEXT");
            shaObj.update($scope.userData.Password);
            var hash = shaObj.getHash("HEX");

            var username = $scope.userData.Username,
                password = $scope.userData.Password;


            if (username !== undefined && password !== undefined) {
                $http.post('/authenticate', {
                    username: username,
                    password: hash
                }).success(function (data) {


                        localStorageService.set('token', data.token);
                        localStorageService.set('userPersonalName', data.user.name);
                        localStorageService.set('userCampus', data.user.College);
                        localStorageService.set('userDepartment', data.user.department);
                        localStorageService.set('userDepartmentSlug', data.user.departmentEng);
                        localStorageService.set('userRole', data.user.role);
                        localStorageService.set('userRoleSlug', data.user.roleslug);
                        localStorageService.set('userCollege', data.user.college);

                        var rolesSlug = data.user.roleslug;


                        /*AuthenticationFactory.isLogged = true;
                         AuthenticationFactory.userRoleName = data.user.Role.Name;
                         AuthenticationFactory.userRole = data.user.Role.Slug;
                         AuthenticationFactory.userDepartment = data.user.Department.Name;
                         AuthenticationFactory.userEmail = data.user.Email;
                         AuthenticationFactory.userEmail = data.user.firstName + ' ' + data.user.lastName;
                         AuthenticationFactory.userPersonalName = data.personalname;*/

                        $rootScope.$broadcast('userLoggedIn');

                        switch (rolesSlug) {
                            case 'lecturer':
                                $location.path("/account/lecturer");
                                break;
                            case 'student':
                                if (data.user.inGroup && !data.user.inProcess) {
                                    console.log("waiting")
                                    $location.path("/account/student/waiting");

                                }
                                else if (data.user.inGroup && data.user.inProcess) {
                                    console.log("action")
                                    $location.path("/account/student/in-process");
                                }
                                else {
                                    $location.path("/account/student");
                                }
                                break;
                            case
                            'manager':
                                $location.path("/account/manager");
                                break;
                            case 'admin':
                                $location.path("account/admin")
                        }

                        /*localStorageService.set('isLogged', AuthenticationFactory.isLogged);
                         localStorageService.set('userPersonalName', data.user.firstName + ' ' + data.user.lastName);
                         localStorageService.set('username', data.user.Username);
                         localStorageService.set('userEmail', data.user.Email);
                         localStorageService.set('userCollege', data.user.College.Slug);
                         localStorageService.set('userId', data.user._id);
                         localStorageService.set('userDepartment', data.user.Department.Slug);
                         localStorageService.set('userDepartmentHeb', data.user.Department.Name);
                         localStorageService.set('userRole', data.user.Role.Slug);
                         localStorageService.set('userRoleHeb', data.user.Role.Name);
                         localStorageService.set('userIsInGroup', data.user.inGroup);
                         localStorageService.set('userInProcess', data.user.inProcess);

                         var userId = data.user._id;

                         if (data.user.Role.Slug == 'student')
                         if (data.user.inGroup)
                         UserAuthFactory.getStudentProject(userId).success(function (data) {
                         if (data != null)
                         localStorageService.set('userProjectId', data._id);
                         });

                         switch (AuthenticationFactory.userRole) {
                         case 'lecturer':

                         $location.path("/account/lecturer");
                         break;
                         case 'student':
                         if (data.user.inGroup && !data.user.inProcess) {
                         console.log("waiting")
                         $location.path("/account/student/waiting");

                         }
                         else if (data.user.inGroup && data.user.inProcess) {
                         console.log("action")
                         $location.path("/account/student/in-process");
                         }
                         else {
                         $location.path("/account/student");
                         }
                         break;
                         case
                         'manager':
                         $location.path("/account/manager");

                         break;
                         }*/
                    }
                ).error(function (status) {
                    toastr.warning("לא נמצא משתמש מתאים, יש לנסות שנית", "לא נמצאה התאמה", globalSettings.toastrOpts);
                });
            } else {
                toastr.warning("לא נמצא משתמש מתאים, יש לנסות שנית", "לא נמצאה התאמה", globalSettings.toastrOpts);
            }

        }
        ;

    }
]);

angular.module("FPM").controller('LogoutCtrl', function ($scope, $location,$http, localStorageService) {
    localStorageService.clearAll();
    $http.get('/logout');
    $location.url('/login');
});


angular.module("FPM").controller('PasswordRecoveryController', function ($scope, $http, globalSettings) {
    $scope.sendPassword = function () {
        if (angular.isDefined($scope.userEmail)) {
            $http.post('/forgot', {
                email: $scope.userEmail,
            }).success(function (data) {
                    toastr.success("מייל שחזור נשלח בהצלחה", "המתינו לקבלת מייל קישור", globalSettings.toastrOpts);
                }
            ).error(function (status) {

                toastr.warning("לא נמצא מייל תואם, אנא נסו שנית", "לא נמצאה התאמה", globalSettings.toastrOpts);
            });
        }
    }
});

angular.module("FPM").controller('PasswordResetController', function ($scope, $http, $routeParams, $location,$timeout,globalSettings) {

    $scope.isFoundUser = true;

    $http.get('/reset/' + $routeParams.token).success(function (data) {
            $scope.user = data;
        }
    ).error(function (status) {
        $scope.isFoundUser = false;
        $location.path("/login");
    });

    $scope.changePassword = function () {
        if ($scope.passwordOnce === $scope.passwordRepeat) {
            $http.post('/reset/' + $routeParams.token, {
                password: $scope.passwordOnce,
            }).success(function () {

                    toastr.success("הינך מועבר לדף התחברות", "הסיסמא שונתה בהצלחה", globalSettings.toastrOpts);

                    $timeout(function () {
                        $location.path("/login");
                    }, 3000);

                }
            ).error(function (status) {


                toastr.error("פנה למנהל מערכת", "קרתה שגיאה", globalSettings.toastrOpts);
            });
        }
        else{

            toastr.error("יש להקפיד על סיסמאות זהות", "סיסמאות אינן זהות", globalSettings.toastrOpts);
        }
    }
});
