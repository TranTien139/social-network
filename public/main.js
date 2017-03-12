var app = angular.module('profileApp',[]);
app.controller('profileController',function($scope,$http){
    $scope.sendAddFriend = function ($me,$friend) {
        $http.post("/send-add-friend/"+$me+'/'+$friend).success(function(){
        });
    }
    $scope.checkIsFollow = function ($id_user) {
        for(var i=0; i<$scope.user.followers.length; i++){
            if($scope.user.followers[i].userId === $id_user){
                return true;
            }
        }
        return false;
    }
});

var app = angular.module('AppShowHide',[]);
app.controller('ShowHideController',function($scope,$http){
});
