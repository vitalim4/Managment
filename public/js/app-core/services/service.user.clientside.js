angular.module('userService', [])
    .factory('Users', function($http) {
            return {
                get: function () {
                    return $http.get('/api/users');
                },
                getSingle: function (userId) {
                    return $http.get('/api/user/'+userId);
                },
                login: function (userData) {
                    return $http.post('/authenticate', userData).success(function (data, status, headers, config) {
                        data;
                    })
                        .error(function (data, status, headers, config) {
                            data.errorMessage = "לא נמצא משתמש בעל פרטים תואמים. אנא נסו שנית.";
                        });
                },
                delete: function (id) {
                    return $http.delete('/api/users/' + id);
                },
                resendPassword: function (userEmail) {
                    return $http.post('/forgot', {data:{Email:userEmail}});
                }
            }
        }
    );
