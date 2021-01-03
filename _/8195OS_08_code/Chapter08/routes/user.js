var mongoose = require( 'mongoose' );
var User = mongoose.model( 'User' );

var clearSession = function(session, callback){
  session.destroy();
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
          User.update(
            {_id:user._id},
            { $set: {lastLogin: Date.now()} },
            function(){
              res.redirect( '/user' );
          });
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
    _id: "",
    name: "",
    email: "",
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

// GET user edit form
exports.edit = function(req, res){
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    res.render('user-form', {
      title: 'Edit profile',
      _id: req.session.user._id,
      name: req.session.user.name,
      email: req.session.user.email,
      buttonText: "Save"
    });
  }
};

// POST user edit form
exports.doEdit = function(req, res) {
  if (req.session.user._id) {
    User.findById( req.session.user._id,
      function (err, user) {
        doEditSave (req, res, err, user);
      }
    );
  }
};

var doEditSave = function(req, res, err, user) {
  if(err){
    console.log(err);
    res.redirect( '/user?error=finding');
  } else {
    user.name = req.body.FullName;
    user.email = req.body.Email;
    user.modifiedOn = Date.now();
    user.save(
      function (err, user) {
        onEditSave (req, res, err, user);
      }
    );
  }
};

var onEditSave = function (req, res, err, user) {
  if(err){
    console.log(err);
    res.redirect( '/user?error=saving');
  } else {
    console.log('User updated: ' + req.body.FullName);
    req.session.user.name = req.body.FullName;
    req.session.user.email = req.body.Email;
    res.redirect( '/user' );
  }
};

// or...

// POST user edit form
/*exports.doEdit = function(req, res) {
  if (req.session.user._id) {
    User.findById( req.session.user._id,
      function (err, user) {
        if(!err){
          user.name = req.body.FullName;
          user.email = req.body.Email;
          user.modifiedOn = Date.now();
          user.save(function (err, user) {
            if(err){
              console.log(err);
            } else {
              console.log('User updated: ' + req.body.FullName);
              req.session.user.name = req.body.FullName;
              req.session.user.email = req.body.Email;
              res.redirect( '/user' );
            }
          });
        }
      }
    );
  }
};
*/

// GET user delete confirmation form
exports.confirmDelete = function(req, res){
  res.render('user-delete-form', {
    title: 'Delete account',
    _id: req.session.user._id,
    name: req.session.user.name,
    email: req.session.user.email
  });
};

// POST user delete form
exports.doDelete = function(req, res) {
  if (req.body._id) {
    User.findByIdAndRemove(
      req.body._id,
      function (err, user) {
        if(err){
          console.log(err);
          return res.redirect('/user?error=deleting');
        }
        console.log("User deleted:", user);
        clearSession(req.session, function () {
          res.redirect('/');
        });
      }
    );
  }
};

// GET user logout
exports.doLogout = function(req, res) {
  clearSession(req.session, function () {
    res.redirect('/');
  });
};
