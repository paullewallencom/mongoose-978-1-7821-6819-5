var mongoose = require( 'mongoose' );
var User = mongoose.model( 'User' );

var clearSession = function(req, res, callback){
  req.session.user = {};
  req.session.loggedIn = "";
  callback();
};


// GET login page
exports.login = function (req, res) {
  res.render('login-form', {title: 'Log in'});
};

// POST login page
exports.doLogin = function (req, res) {
  if (req.body.Email) {
    User.findOne({'email' : req.body.Email}, '_id name email modifiedOn', function(err, user) {
      if (!err) {
        if (!user){
          res.redirect('/login?404=user');
        }else{
          req.session.user = { "name" : user.name, "email": user.email, "_id": user._id };
          req.session.loggedIn = true;
          console.log('Logged in user: ' + user);
          res.redirect( '/user' );
        }
      } else {
        res.redirect('/login?404=error');
      }
    });
  } else {
    res.redirect('/login?404=error');
  }
};

// GET logged in user page
exports.index = function (req, res) {
  if(req.session.loggedIn === true){
    res.render('user-page', {
      title: req.session.user.name,
      name: req.session.user.name,
      email: req.session.user.email,
      userID: req.session.user._id
    });
  }else{
    res.redirect('/login');
  }
};

// GET user creation form
exports.create = function(req, res){
  res.render('user-form', {
    title: 'Create user',
    buttonText: "Join!"
 });
};

// POST new user creation form
exports.doCreate = function(req, res){
  User.create({
    name: req.body.FullName,
    email: req.body.Email,
    modifiedOn : Date.now(),
    lastLogin : Date.now()
  }, function( err, user ){
    if(err){
      console.log(err);
      if(err.code===11000){
        res.redirect( '/user/new?exists=true' );
      }else{
        res.redirect('/?error=true');
      }
    }else{
      console.log("User created and saved: " + user);
      req.session.user = { "name" : user.name, "email": user.email, "_id": user._id };
      req.session.loggedIn = true;
      res.redirect( '/user' );
    }
  });
};

// GET user logout
exports.doLogout = function(req, res) {
  clearSession(req, res, function () {
    res.redirect('/');
  });
};
