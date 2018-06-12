angular.module("FPM").controller('dashboardYear', function ($scope, $window, $http, localStorageService, DTOptionsBuilder,DTColumnBuilder,Projects,globalSettings,$timeout,DataTablesOptions,Upload) {

    console.log("dashboardYear entered");
    var displayYears = function(){
        $http({
            method: 'GET',
            url: '/api/years'
        }).success(function (result) {
            $scope.years = result;
        });
    
    }

    displayYears();
    $scope.selectedYear;
    $scope.addNewYear = function(){
        var yearObject = $scope.yearMeataData.filter(function (el) {
            return (el.Name === $scope.selectedYear);
        });
        var existYear = $scope.years.filter(function (el) {
            return (el.Name === $scope.selectedYear);
        });
        if(existYear.length > 0 || yearObject.length == 0){
            $('#existYear').modal('show');
        }
        else{
            $http.post('/api/add/years', yearObject[0])
            .then(function mySuccess(data) {
                toastr.success("השנה התווספה בהצלחה", globalSettings.toastrOpts);
                displayYears();    
            }, function myError(data) {
                console.log("an error occured: "+data);
            });
        }
    }

    $scope.yearMeataData = [
        {Slug:"2019",Name:"תשעט"},
        {Slug:"2020",Name:"תשפ"},
        {Slug:"2021",Name:"תשפא"},
        {Slug:"2022",Name:"תשפב"},
        {Slug:"2023",Name:"תשפג"},
        {Slug:"2024",Name:"תשפד"},
        {Slug:"2025",Name:"תשפה"},
        {Slug:"2026",Name:"תשפו"},
        {Slug:"2027",Name:"תשפז"},
        {Slug:"2028",Name:"תשפח"},
        {Slug:"2029",Name:"תשפט"},
        {Slug:"2030",Name:"תשצ"},
        {Slug:"2031",Name:"תשצא"},
        {Slug:"2032",Name:"תשצב"},
        {Slug:"2033",Name:"תשצג"},
        {Slug:"2034",Name:"תשצד"},
        {Slug:"2035",Name:"תשצה"},
        {Slug:"2036",Name:"תשצו"},
        {Slug:"2037",Name:"תשצז"},
        {Slug:"2038",Name:"תשצח"},
        {Slug:"2039",Name:"תשצט"},
        {Slug:"2040",Name:"תת"},
        {Slug:"2041",Name:"תתא"},
        {Slug:"2042",Name:"תתב"},
        {Slug:"2043",Name:"תתג"},
        {Slug:"2044",Name:"תתד"},
        {Slug:"2045",Name:"תתה"},
        {Slug:"2046",Name:"תתו"},
        {Slug:"2047",Name:"תתז"},
        {Slug:"2048",Name:"תתח"},
        {Slug:"2049",Name:"תתט"},
        {Slug:"2050",Name:"תתי"},
    ]

});