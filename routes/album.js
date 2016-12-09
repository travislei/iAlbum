var uuid = require('uuid');
var fs = require('fs');
var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {});

/* 1. GET init */
router.get('/init', function (req, res, next) {
  var id = req.cookies.userID;

  if (id === undefined) {
    res.send('');
  } else {
    var db = req.db;
    var collection = db.get('userList');

    // Get all users JSON
    var getAllUsers = function (callback) {
      collection.find({}, function (err, data) {
        callback(err, data)
      })
    }

    // Get username and friends from _id
    var getInfo = function (id, callback) {
      collection.findOne({
        '_id': id
      }, function (err, data) {
        callback(err, {
          'username': data.username,
          'friends': data.friends
        });
      })
    }

    // Prepare JSON data
    var json = {};
    json.friends = [];

    // Get username and friends list
    getInfo(id, function (err, info) {
      if (err) return res.send(err);

      // Set username
      json.username = info.username;

      // Get all users
      getAllUsers(function (err, list) {
        if (err) return res.send(err);

        // Friend checking...
        for (var i = 0; i < list.length; ++i) {
          if (info.friends.indexOf(list[i].username) > -1)
            json.friends.push({
              '_id': list[i]._id,
              'username': list[i].username
            });
        }

        res.json(json);
      })
    })
  }
});

/* 2. POST login */
router.post('/login', function (req, res, next) {
  // Get
  var usr = req.body.username;
  var pwd = req.body.password;

  var db = req.db;
  var collection = db.get('userList');

  collection.findOne({
    'username': usr,
    'password': pwd
  }, function (err, data) {
    if (data === null) {
      res.send('Login failure');
    } else {
      var id = String(data._id);

      // Set cookie
      res.cookie('userID', id, {
        maxAge: 3600000,
        httpOnly: true,
        resave: false
      });

      // Get all users JSON
      var getAllUsers = function (callback) {
        collection.find({}, function (err, data) {
          callback(err, data)
        })
      }

      // Prepare JSON data
      var json = {};
      json.friends = [];

      getAllUsers(function (err, list) {
        if (err) return res.send(err);

        // Friend checking...
        for (var i = 0; i < list.length; ++i) {
          if (data.friends.indexOf(list[i].username) > -1)
            json.friends.push({
              '_id': list[i]._id,
              'username': list[i].username
            });
        }

        res.json(json);
      })
    }
  });

});

/* 3. GET logout */
router.get('/logout', function (req, res, next) {
  res.clearCookie('userID').send('');
});

/* 4. GET getalbum */
router.get('/getalbum/:uid', function (req, res, next) {
  var uid = String(req.params.uid);

  if (uid === '0')
    uid = req.cookies.userID;

  // find in MongoDB
  var db = req.db;
  var collection = db.get('photoList');

  collection.find({
    'userid': uid
  }, function (err, list) {
    if (err) return res.send(err);

    if (list.length === 0)
      return res.send('no photo');

    var json = [];

    list.forEach(function (data) {
      json.push({
        '_id': data._id,
        'url': data.url,
        'likedby': data.likedby
      });
    })

    res.json(json);
  });
});

/* 5. POST uploadPhoto */
router.post('/uploadphoto', function (req, res, next) {
  var id = req.cookies.userID;

  if (id === undefined) {
    return res.send('Not logged in!');
  } else {
    var filename = String(uuid.v4()) + '.jpg';
    var path = rootPath + '/public/uploads/' + filename;

    // write the file
    fs.writeFile(path, req.body.base64, 'base64');

    // insert into MongoDB
    var db = req.db;
    var collection = db.get('photoList');

    var url = 'uploads/' + filename
    collection.insert({
      'url': url,
      'userid': id,
      'likedby': []
    }, function (err, data) {
      res.json({
        '_id': data._id,
        'url': url
      });
    })
  }
});

/* 6. DELETE deletephoto */
router.delete('/deletephoto/:pid', function (req, res, next) {
  var pid = String(req.params.pid);

  // find in MongoDB
  var db = req.db;
  var collection = db.get('photoList');

  // find the photo in MongoDB
  collection.findOne({
    '_id': pid
  }, function (err, photo) {
    if (err) res.send(err);

    if (photo === null) {
      res.send('no photo');
      return;
    }

    var path = rootPath + '/public/' + photo.url;

    // remove data in MongoDB
    collection.remove({
      '_id': pid
    }, function (err, data) {
      if (err) res.send('err');

      // remove file now
      fs.unlink(path, function (err) {
        if (err) res.send(err);

        res.send('');
      });
    });
  });
});

/* 7. PUT updatelike */
router.put('/updatelike/:pid', function (req, res, next) {
  var uid = req.cookies.userID;

  if (uid === undefined) {
    return res.send('not logged in');
  } else {
    var pid = String(req.params.pid);

    // find in MongoDB
    var db = req.db;
    var collection = db.get('userList');

    collection.findOne({
      '_id': uid
    }, function (err, info) {
      var usr = info.username;

      var photoCollection = db.get('photoList');

      photoCollection.findOne({
        '_id': pid
      }, function (err, photo) {
        if (err) return res.send(err);

        var likedby = photo.likedby;

        if (likedby.indexOf(usr) === -1) {
          likedby.push(usr);

          photoCollection.update({
            '_id': pid
          }, {
            $push: {
              'likedby': usr
            }
          }, function (err, result) {
            if (err) return res.send(err);

            res.send(likedby);
          });
        } else {
          res.send('liked');
        }
      })
    });
  }
});

module.exports = router;