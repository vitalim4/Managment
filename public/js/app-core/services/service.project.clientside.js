/*angular.module('projectService', [])
// super simple service
// each function returns a promise object
    .factory('Projects', function ($http, localStorageService) {
        return {
            get: function () {
                return $http.get('/api/projects');
            },
            getSingle: function (id) {
                return $http.get('/api/project/' + id);
            },
            delete: function (id) {
                return $http.delete('/api/projects/' + id);
            },
            getByLecturer: function (lecturer) {
                return $http.get('/api/lecturer/projects/'+lecturer);
            },
            getByManager: function () {

                var Department = localStorageService.get('userDepartment');
                var College = localStorageService.get('userCollege');

                return $http.get('/api/manager/'+College+'/'+Department);
            },
            sendForApproval: function (projId) {
                return $http.get('/api/manager/approve/ask-for-approval/' + projId);
            },
            rejectApprovalRequest: function (requestId, rejectContent) {
                return $http.post('/api/manager/request/reject/', {requestId:requestId, rejectContent:rejectContent});
            },
            acceptApprovalRequest: function (requestId) {
                return $http.post('/api/manager/request/accept/', {requestId:requestId});
            },
            filterProjects: function (filters,inGroup) {
                return $http.post('/api/project/filter', {filters:filters, inGroup:inGroup});
            },
            advancedFilterProjects: function (filters) {
                return $http.post('/api/project/advanced-filter', {filters:filters});
            }
        }
    });
*/