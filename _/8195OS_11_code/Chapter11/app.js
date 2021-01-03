var express = require('express')
  , db = require('./model/db')
  , routes = require('./routes')
  , user = require('./routes/user')
  , project = require('./routes/project')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
// USER ROUTES
app.get('/user', user.index);           // Current user profile
app.get('/user/new', user.create);      // Create new user form
app.post('/user/new', user.doCreate);   // Create new user action
app.get('/user/edit', user.edit);       // Edit current user form
app.post('/user/edit', user.doEdit);    // Edit current user action
app.get('/user/delete', user.confirmDelete);       // delete current user form
app.post('/user/delete', user.doDelete);    // Delete current user action
app.get('/logout', user.doLogout);          // Logout current user
app.get('/login', user.login);          // Edit current user form
app.post('/login', user.doLogin);       // Edit current user action
// PROJECT ROUTES
app.get('/project/new', project.create);      // Create new project form
app.post('/project/new', project.doCreate);   // Create new project action
app.get('/project/:id', project.displayInfo);      // Display project info
app.get('/project/edit/:id', project.edit);       // Edit selected project form
app.post('/project/edit/:id', project.doEdit);    // Edit selected project action
app.get('/project/delete/:id', project.confirmDelete);       // Delete selected project form
app.post('/project/delete/:id', project.doDelete);    // Delete selected project action
app.get('/project/byuser/:userid', project.byUser);   // Projects created by a user
app.get('/project/:id/task/new', project.createTask);      // Create new task form
app.post('/project/:id/task/new', project.doCreateTask);      // Create new task action
app.get('/project/:id/task/edit/:taskID', project.editTask);      // Edit task form
app.post('/project/:id/task/edit/:taskID', project.doEditTask);      // Edit task action
app.get('/project/:id/task/delete/:taskID', project.confirmDeleteTask);      // Delete task form
app.post('/project/:id/task/delete/:taskID', project.doDeleteTask);      // Delete task action


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});