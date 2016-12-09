var albumApp = angular.module('album', ['ngRoute', 'naif.base64']);

albumApp.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'index.html',
      controller: 'InitController'
    })
    .when('/getalbum/:uid', {
      templateUrl: 'getalbum.html',
      controller: 'GetAlbumController'
    })
    .otherwise({
      redirectTo: '/'
    });
});

albumApp.controller('InitController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  $http.get('/init')
    .then(function (res) {
        if (res.data === '') return;

        $rootScope.loginStatus = 'isLogin';
        $rootScope.username = res.data.username;
        $rootScope.firendsList = res.data.friends;
      },
      function (res) {
        alert('FATAL ERROR: Cannot GET init');
      });
}]);

albumApp.controller('NavController', ['$scope', '$location', function ($scope, $location) {
  $scope.$location = $location;
}]);

albumApp.controller('LoginController', ['$scope', '$rootScope', '$http', '$timeout', function ($scope, $rootScope, $http, $timeout) {
  // Login button
  $scope.login = function (user) {
    if (!user || Object.keys(user).length != 2) {
      alert('You must enter username and password');
      return;
    }

    $http.post('/login', user)
      .then(function (res) {
          if (res.data === 'Login failure') {
            $scope.notifn = 'yes';
            $scope.notifnText = 'Login failure';
          } else {
            $scope.username = user.username;
            $rootScope.loginStatus = 'isLogin';
            $rootScope.firendsList = res.data.friends;

            $scope.notifn = 'yes';
            $scope.notifnText = 'Login successfully';

            $timeout(function () {
              $scope.notifn = '';
            }, 2000);
          }
        },
        function (res) {
          alert('FATAL ERROR: Cannot POST login');
        });
  }

  // Logout button
  $scope.logout = function () {
    $http.get('/logout')
      .then(function (res) {
        if (res.data === '') {
          $rootScope.loginStatus = '';

          $scope.notifn = 'yes';
          $scope.notifnText = 'Logout successfully';

          $timeout(function () {
            $scope.notifn = '';
          }, 2000);
        }
      }, function (res) {
        alert('FATAL ERROR: Cannot GET logout');
      });
  }
}]);

albumApp.controller('GetAlbumController', ['$scope', '$timeout', '$routeParams', '$http', '$route', function ($scope, $timeout, $routeParams, $http, $route) {
  if (parseInt($routeParams.uid) === 0)
    $scope.myAlbum = 'yes';

  $http.get('/getalbum/' + $routeParams.uid)
    .then(function (res) {
      console.log(res.data);
      if (res.data !== 'no photo')
        $scope.photos = res.data;
    }, function (res) {
      alert('FATAL ERROR: Cannot GET getalbum');
    });

  $scope.likePhoto = function (pid) {
    $http.put('/updatelike/' + pid)
      .then(function (res) {
        if (res.data === 'liked') {
          alert('You liked this photo already');
        } else {
          for (var i = 0; i < $scope.photos.length; ++i)
            if ($scope.photos[i]._id === pid) {
              $scope.photos[i].likedby = res.data;
              return;
            }
        }
      }, function (res) {
        alert('FATAL ERROR: Cannot PUT updatelike');
      });
  };

  $scope.deletePhoto = function (pid) {
    if (!confirm('Areyou sure you want to delete this photo')) return;

    $http.delete('/deletephoto/' + pid)
      .then(function (res) {
        if (res.data === '') {
          for (var i = 0; i < $scope.photos.length; ++i)
            if ($scope.photos[i]._id === pid) {
              $scope.photos.splice(i, 1);
              return;
            }
        } else {
          alert(res.data);
        }
      }, function (res) {
        alert('FATAL ERROR: Cannot DELETE deletephoto');
      });
  };

  $scope.upload = function (data) {
    if (data === undefined) {
      alert('Please select a file!');
      return;
    }

    $http.post('/uploadphoto', data)
      .then(function (res) {
        if (res.data.length !== 0) {
          $scope.photos.push({
            '_id': res.data._id,
            'url': res.data.url,
            'likedby': []
          });
        } else {
          alert(res.data);
        }
      }, function (res) {
        alert('FATAL ERROR: Cannot POST uploadPhoto');
      });
  }
}]);