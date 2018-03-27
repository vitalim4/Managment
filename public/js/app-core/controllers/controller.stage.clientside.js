angular.module("FPM").controller('stageController', function ($scope, localStorageService, $http) {

    console.log('stageController entered')
    var curUserID = localStorageService.get('userId');

    $scope.projectData = {};
    /*
     * Project data loading into a local object
     * */
    
    /*$http.get('/api/project/getbystudent/' + curUserID).success(function (userProject) {
        $scope.projectData = userProject;
        console.log($scope.projectData)
    });*/
  
    $http.get('/api/student/projects/').success(function (userProject) {
        $scope.projectData = userProject;
    });

    $scope.setStageColor = function(index, curOrder){     
        if(index == curOrder){            
            return {"background-color":"#ffbf00"};
        }
        else if(index < curOrder){
            return {"background-color":"#007f00"};
        }
        else if(index > curOrder){
            return {"background-color":"#d3d3d3"};
        }
    }
});