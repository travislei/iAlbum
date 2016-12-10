var albumApp = angular.module('album', ['ngRoute', 'naif.base64']);

/*
 * Routing information
 */
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

/*
 * Controllers
 */
albumApp.controller('InitController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  $rootScope.userID = '';

  // GET request to init
  $http.get('/init')
    .then(function (res) {
        // Do nothing if empty string
        if (res.data === '') return;

        $rootScope.loginStatus = 'isLogin';
        $rootScope.username = res.data.username;
        $rootScope.firendsList = res.data.friends;
      },
      function (res) {
        alert('FATAL ERROR: Cannot GET init');
      });
}]);

albumApp.controller('NavController', ['$scope', '$rootScope', '$location', function (userID, $scope, $rootScope, $location) {
  // Set the userID value
  $scope.setUID = function (uid) {
    $scope.userID = uid;
  };
}]);

albumApp.controller('LoginController', ['$scope', '$rootScope', '$http', '$timeout', function ($scope, $rootScope, $http, $timeout) {
  // Login button
  $scope.login = function (user) {
    if (!user || Object.keys(user).length != 2) {
      alert('You must enter username and password');
      return;
    }

    // POST request to login
    $http.post('/login', user)
      .then(function (res) {
        if (res.data === 'Login failure') {
          $scope.notifn = 'yes';
          $scope.notifnText = 'Login failure';
        } else {
          $scope.username = user.username;
          $rootScope.loginStatus = 'isLogin';
          $rootScope.firendsList = res.data.friends;

          // Alert user
          $scope.notifn = 'yes';
          $scope.notifnText = 'Login successfully';
        }

        // Finish alerting
        $timeout(function () {
          $scope.notifn = '';
        }, 2000);
      }, function (res) {
        alert('FATAL ERROR: Cannot POST login');
      });
  }

  // Logout button
  $scope.logout = function () {
    $http.get('/logout')
      .then(function (res) {
        if (res.data === '') {
          $rootScope.loginStatus = '';

          // Alert user
          $scope.notifn = 'yes';
          $scope.notifnText = 'Logout successfully';

          // Finish alerting
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
  // Check if it is My Album
  if (parseInt($routeParams.uid) === 0)
    $scope.myAlbum = 'yes';

  // Photo list
  $scope.photos = [];

  // GET request to getalbum
  $http.get('/getalbum/' + $routeParams.uid)
    .then(function (res) {
      if (res.data !== 'no photo')
        $scope.photos = res.data;
    }, function (res) {
      alert('FATAL ERROR: Cannot GET getalbum');
    });

  // PUT request to updatelike
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

  // DELETE request to deletphoto
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

  // POST request to uploadphoto
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

          document.getElementById('photo-upload-form').reset();
        } else {
          alert(res.data);
        }
      }, function (res) {
        alert('FATAL ERROR: Cannot POST uploadPhoto');
      });
  };

  // View large photo mode
  $scope.viewPhoto = function (photo) {
    $scope.viewMode = 'largePhoto';
    $scope.viewPhoto = photo;
  };

  // Reload page and set to album view mode
  $scope.reload = function () {
    $scope.viewMode = '';
    $route.reload();
  };
}]);