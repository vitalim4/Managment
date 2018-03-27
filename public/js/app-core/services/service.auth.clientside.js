/*
angular.module('authService', [])
    .factory('AuthenticationFactory', function (localStorageService) {
        var auth = {
            isLogged: false,

            userPersonalName: "",
            userEmail: "",
            userRoleName: "",
            userDepartment: "",


            isStudent: false,
            isLecturer: false,
            isManager: false,
            check: function () {
                if (localStorageService.get('token') && localStorageService.get('isLogged')) {
                    this.isLogged = true;

                } else {
                    this.isLogged = false;
                    delete this.user;
                }
            }
        }

        return auth;
    })
    /!*.factory('UserAuthFactory', function ($location, $http,$route, AuthenticationFactory, localStorageService) {
        return {
            login: function (username, password) {
                
                return $http.post('/authenticate', {
                    username: username,
                    password: password
                });
            },
            getStudentProject: function (studentId) {
                return $http.get('/api/project/getbystudent/' + studentId);
            },
            logout: function () {

                if (AuthenticationFactory.isLogged) {

                    AuthenticationFactory.isLogged = false;
                    delete AuthenticationFactory.user;
                    delete AuthenticationFactory.userRole;
                    delete AuthenticationFactory.isLogged;
                    delete AuthenticationFactory.userRoleName;
                    delete AuthenticationFactory.userRole;
                    delete AuthenticationFactory.userDepartment;
                    delete AuthenticationFactory.userPersonalName;
                    delete AuthenticationFactory.userEmail;

                    localStorageService.clearAll();
                }
                localStorageService.clearAll();

            }
        }
    });*!/
    /!*.factory('TokenInterceptor', function ($q, localStorageService) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if (localStorageService.get('token')) {
                    //config.headers['X-Access-Token'] = localStorageService.get('token');
                    //config.headers['X-Key'] = localStorageService.get('userId');
                    //config.headers['Content-Type'] = "undefined";
                }
                return config || $q.when(config);
            },

            response: function (response) {
                return response || $q.when(response);
            }
        };
    });*!/*/
