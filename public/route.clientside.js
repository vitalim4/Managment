// Create an application module for our demo.
var app = angular.module("FPM", ['ngRoute','chart.js', 'LocalStorageModule', 'ngFileUpload', 'datatables', 'datatables.buttons', 'ngResource', 'ngAnimate', 'ui.bootstrap', 'ngAnimate', 'userService', 'globalSettings','ngTagsInput']);

// configure our routes
app.config(function ($routeProvider, localStorageServiceProvider) {

        $routeProvider
            .when('/account/lecturer/', {
                templateUrl: 'partials/lecturer-dashboard.html',
                controller: 'dashboardController'
            })
            .when('/account/lecturer/project/:projectId', {
                templateUrl: 'partials/lecturer-project.html',
                controller: 'projectController'
            })
            .when('/account/lecturer/project', {
                templateUrl: 'partials/lecturer-project.html',
                controller: 'projectController'
            })
            .when('/login', {
                templateUrl: 'login.html',
                controller: 'LoginController'
            })
            .when('/forgot-password', {
                templateUrl: 'partials/forgot-password.html',
                controller: 'PasswordRecoveryController'
            })
            .when('/reset/:token', {
                templateUrl: 'partials/reset-password.html',
                controller: 'PasswordResetController'
            })
            .when('/account/student/waiting', {
                templateUrl: 'partials/student-waiting.html',
                controller: 'studentWaitingController'
            })
            .when('/account/student/in-process/:projslug', {
                templateUrl: 'partials/student-in-action.html',
                controller: 'stageController'
            })
            .when('/account/student/in-process/', {
            templateUrl: 'partials/student-in-action.html',
            controller: 'stageController'
            })
            .when('/account/student/project/:projectId', {
                templateUrl: 'partials/student-display-project.html',
                controller: 'studentViewProjectController'
            })
            .when('/logout', {
                templateUrl: 'logout.html',
                controller: 'LogoutCtrl'
            })
            .when('/account/student/', {
                templateUrl: 'partials/student-pre-project-view.html',
                controller: 'studentController'
            })
            .when('/account/manager/request/:requestId', {
                templateUrl: 'partials/manager-view-request.html',
                controller: 'requestsManager'
            })

            //Manager Users
            .when('/account/manager/', {
                templateUrl: 'partials/manager-projects.html',
                controller: 'managerProjectsController'
            })
            .when('/account/manager/users', {
                templateUrl: 'partials/manager-users.html',
                controller: 'managerUsersController'
            })
            .when('/account/manager/users/import', {
                templateUrl: 'partials/manager-users-import.html',
                controller: 'managerUsersImportController'
            })
            .when('/account/manager/users/:userId', {
                templateUrl: 'partials/manager-user-page.html',
                controller: 'managerSingleUserController'
            })
            .when('/account/manager/archive/requests', {
                templateUrl: 'partials/manager-archive-requests.html',
                controller: 'projectManagerRequestsArchive'
            })
            .when('/account/manager/requests', {
                templateUrl: 'partials/manager-requests.html',
                controller: 'projectManagerRequests'
            })
            .when('/account/manager/projects', {
                templateUrl: 'partials/manager-projects.html',
                controller: 'managerProjectsController'
            })
            .when('/account/manager/project/:projectId', {
                templateUrl: 'partials/manager-single-project.html',
                controller: 'projectController'
            })
            .when('/account/manager/user/add', {
                templateUrl: 'partials/manager-user-page.html',
                controller: 'managerSingleUserController'
            })
            .when('/account/manager/user/:userId', {
                templateUrl: 'partials/manager-user-page.html',
                controller: 'managerSingleUserController'
            })
            //Manager Reports
            .when('/account/manager/reports/ungrouped-students', {
                templateUrl: 'partials/manager-report-ungroupped-students.html',
                controller: 'managerReportUngroupedStudentsController'
            })
            .when('/account/manager/reports/lecturers-without-projects', {
                templateUrl: 'partials/manager-not-started-lecturers.html',
                controller: 'managerReportWOProjectLecturersController'
            })
            .when('/account/manager/reports/projects', {
                templateUrl: 'partials/manager-projects-reports.html',
                controller: 'managerProjectsController'
            })
            .when('/account/manager/reports', {
                templateUrl: 'partials/manager-user-page.html',
                controller: 'managerSingleUserController'
            })
            .when('/account/manager/archive/requests', {
                templateUrl: 'partials/manager-archive-requests.html',
                controller: 'projectManagerRequestsArchive'
            })
            .when('/account/admin', {
                templateUrl: 'partials/manager-projects.html',
                controller: 'managerProjectsController'
            })

            .otherwise({redirectTo: '/login'});

        localStorageServiceProvider.setPrefix('FPM-local');


        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-bottom-left",
            "onclick": undefined,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

    }
);

app.factory('AuthInterceptor', function ($q, localStorageService, $location) {
    return {
        'request': function (config) {
            config.headers = config.headers || {};
            if (localStorageService.get('token')) {
                config.headers.Authorization = 'Bearer ' + localStorageService.get('token');
            }
            return config;
        },
        'responseError': function (response) {
            if (response.status === 401 || response.status === 403) {
                $location.path('/login');
            }
            return $q.reject(response);
        }
    };

});

// Register the previously created AuthInterceptor.
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});


app.run(function ($rootScope, $window, $location) {

    // register listener to watch route changes
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        /*if (localStorageService.get('isLogged') == true) {
         // no logged user, we should be going to #login
         if (next.templateUrl == "login.html") {
         if (localStorageService.get('userRole') == 'lecturer') {
         $location.path("/account/lecturer");
         }
         else if (localStorageService.get('userRole') == 'student') {
         if (localStorageService.get('userIsInGroup') && localStorageService.get('userInProcess')) {
         $location.path("/account/student/in-process");
         }
         else if (localStorageService.get('userIsInGroup') && !localStorageService.get('userInProcess')) {
         $location.path("/account/student/waiting");
         }
         }
         }
         }
         else {
         // not going to #login, we should redirect now

         $location.path("/login");

         }*/

        $window.ga('send', 'pageview', $location.path());

    });

    $window.ga('create', 'UA-80217096-1', 'auto');


});





