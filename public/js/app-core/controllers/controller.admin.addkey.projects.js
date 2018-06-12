

angular.module("FPM").controller('addKeyProjectController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,DataTablesOptions,Upload) {

    console.log("addKeyProjectController entered");
    $scope.keyName;
    $scope.slugName;
    $scope.addNewKey = function(){
        var keys = {};
        if( typeof $scope.slugName !== "undefined" && typeof $scope.keyName !== "undefined"){
            keys["Slug"] = $scope.slugName;
            keys["Name"] =  $scope.keyName;        
            $http.post('/api/add/project/keys', keys)
            .then(function mySuccess(data) {
                toastr.success("המפתח התווסף בהצלחה", globalSettings.toastrOpts); 
                $("#Name").val("");
                $("#Slug").val("");
            }, function myError(data) {
                console.log("an error occured: "+data);
            });
        }
        else{
            $('#existKey').modal('show');            
        }       
    }

});