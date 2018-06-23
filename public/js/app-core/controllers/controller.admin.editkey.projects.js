
angular.module("FPM").controller('editKeyProjectController', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,DataTablesOptions,Upload) {

    console.log("editKeyProjectController entered");

    /* Loading all existing keys to form to form
    */
    var getKeysData = function(){
        $http({
            method: 'GET',
            url: '/api/projects/keys'
        }).success(function (result) {
            $scope.projectkeys = result;
        });
    }
    getKeysData();
    $scope.selectedKey;
    var keys = {};
    $scope.submitKey = function(){
        var found = false;
        var foundObj = {};
        if($("#inpName").val() !== "" && $("#inpSlug").val() !== ""){

            for(var i = 0; i < $scope.projectkeys.length; i++) {
                if ($scope.projectkeys[i].Name == $("#inpName").val() || $scope.projectkeys[i].Slug ==  $("#inpSlug").val()) {
                    found = true;
                    foundObj = $scope.projectkeys[i];
                    break;
                }
            }
            if(found){  
                foundObj.Name == $("#inpName").val() ? $('#existKeyName').modal('show') : $('#existKeySlug').modal('show')  
            }
            else{
                keys["Slug"] = $("#inpSlug").val();
                keys["Name"] =  $("#inpName").val();        
                $http.post('/api/update/project/keys', keys)
                .then(function mySuccess(data) {
                    toastr.success("המפתח עודכן בהצלחה", globalSettings.toastrOpts); 
                    $("#inpName").val("");
                    $("#inpSlug").val("");
                    getKeysData();
                }, function myError(data) {
                    console.log("an error occured: "+data);
                });
            }
        }
        else{
            $('#emptyKey').modal('show');            
        }    
    }

    $scope.getKeys = function(el){
        var keyObject = $scope.projectkeys.filter(function (el) {
            return (el.Slug === $scope.selectedKey);
        });
        if(keyObject.length > 0){
            keys["Ref"] = $scope.selectedKey;
            $('#inpName').val(keyObject[0].Name);
            $('#inpSlug').val(keyObject[0].Slug);      
        }
    }

    $scope.deleteKey = function(){
        $http.post('/api/delete/project/keys', keys)
        .then(function mySuccess(data) {
            toastr.success("המפתח נמחק בהצלחה", globalSettings.toastrOpts); 
            $("#inpName").val("");
            $("#inpSlug").val("");
            $scope.closeModal();    
            getKeysData();
        }, function myError(data) {
            console.log("an error occured: "+data);
        });
       
    }

    $scope.showDeleteModalKey = function(){
        if( $("#inpName").val() == "" && $("#inpSlug").val() == ""){ 
            $('#existKey').modal('show');        
        }
        else{
            $('#deleteKey').modal('show');
        }              
    }
    $scope.closeModal = function(){
        $('#deleteKey').modal('hide');     
    }

    
});