

angular.module("FPM").controller('addKeyProjectController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,DataTablesOptions,Upload) {

    console.log("addKeyProjectController entered");
    $scope.keyName = "";
    $scope.slugName = "";

    var getKeysData = function(){
        $http({
            method: 'GET',
            url: '/api/projects/keys'
        }).success(function (result) {
            $scope.projectkeys = result;          
        });
    }
    getKeysData();

    $scope.addNewKey = function(){
        var keys = {};
        var found = false;
        var foundObj = {};
        if($("#Name").val() !== "" &&  $("#Slug").val() !== ""){
            for(var i = 0; i < $scope.projectkeys.length; i++) {
                if ($scope.projectkeys[i].Name == $("#Name").val() || $scope.projectkeys[i].Slug ==  $("#Slug").val()) {
                    found = true;
                    foundObj = $scope.projectkeys[i];
                    break;
                }
            }
            if(found){  
                foundObj.Name == $("#Name").val() ? $('#existKeyName').modal('show') : $('#existKeySlug').modal('show')  
            }
            else{
                keys["Slug"] =  $("#Slug").val();
                keys["Name"] =  $("#Name").val();        
                $http.post('/api/add/project/keys', keys)
                .then(function mySuccess(data) {
                    toastr.success("המפתח התווסף בהצלחה", globalSettings.toastrOpts); 
                    $("#Name").val("");
                    $("#Slug").val("");
                }, function myError(data) {
                    console.log("an error occured: "+data);
                });
            }          
        }
        else{
            $('#emptyKey').modal('show');            
        }       
    }

});