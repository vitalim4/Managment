angular.module("FPM").factory('Projects', function ($http, localStorageService) {
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
        sendForApproval: function (projId) {
            return $http.get('/api/manager/approve/ask-for-approval/' + projId);
        },
        deleteProject: function (projId) {
            return $http.delete('/api/manager/project/' + projId);
        },
        filterProjects: function (filters, inGroup, inDepartment) {
            return $http.post('/api/project/filter', {
                filters: filters,
                inGroup: inGroup,
                inDepartment: inDepartment
            });
        },
        filterProjectsKey: function (filters, inGroup, inDepartment) {
            return $http.post('/api/project/filter/keys', {
                filters: filters,
                inGroup: inGroup,
                inDepartment: inDepartment
            });
        },
        getRequestsByManager: function () {
            return $http.get('/api/manager/');
        },
        getRequestsByManagerArchive: function () {

            var Department = localStorageService.get('userDepartment');
            var College = localStorageService.get('userCollege');

            return $http.get('/api/manager/archive/');
        },
        getRequest: function (requestId) {
            if (requestId) {
                var Department = localStorageService.get('userDepartment');
                var College = localStorageService.get('userCollege');

                return $http.get('/api/manager/request/' + requestId);
            }
            return;
        },
        rejectApprovalRequest: function (requestId, rejectContent) {
            return $http.post('/api/manager/request/reject/'+requestId, {rejectContent: rejectContent});
        },
        acceptApprovalRequest: function (requestId) {
            return $http.post('/api/manager/request/accept/'+requestId);
        },
        
        updateProjectsStatus: function (requestId) {
            return $http.post('/api/project/updatestage/'+requestId);
        },
        uncheckProjectsStatus: function (requestId) {
            return $http.post('/api/project/uncheckstage/'+requestId);
        },
        sendComment: function (requestId, comment) {
            return $http.post('/api/manager/request/comment/'+requestId, {commentTxt: comment});
        }
    }
});
