var mongoose = require( 'mongoose' );
var Project = mongoose.model( 'Project' );


// GET project creation form
exports.create = function(req, res){
  var strProjectName = '',
      strTasks = '',
      arrErrors = [];
  if (req.session.loggedIn === true){
    if (req.session.tmpProject) {
      strProjectName = req.session.tmpProject.projectName;
      req.session.tmpProject = '';
    }
    if (req.query){
      if (req.query.projectName === 'invalid'){
        arrErrors.push('Please enter a valid project name, minimun 5 characters');
      }
    }

    res.render('project-form', {
      title: 'Create project',
      userid: req.session.user._id,
      userName: req.session.user.name,
      projectID: '',
      projectName: strProjectName,
      tasks: strTasks,
      buttonText: 'Make it so!',
      errors: arrErrors
   });
  }else{
    res.redirect('/login');
  }
};

// POST project creation form
exports.doCreate = function(req, res){
  Project.create({
    projectName: req.body.projectName,
    createdBy: req.body.userid,
    createdOn : Date.now()
  }, function( err, project ){
    var qstring = '?';
    if(err){
      console.log(err);
      if (err.name === "ValidationError") {
        for (var input in err.errors) {
          qstring += input + '=invalid&';
          console.log(err.errors[input].message);
        }
      }else{
        res.redirect('/?error=true');
      }
      req.session.tmpProject = { "projectName": req.body.projectName};
      res.redirect('/project/new' + qstring);
    }else{
      console.log("Project created and saved: " + project);
      console.log("project._id = " + project._id);
      res.redirect( '/project/' + project._id );
    }
  });
};

// GET project info
exports.displayInfo = function(req, res) {
  console.log(req.params.id);
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.params.id) {
      Project
      .findById( req.params.id)
      .populate('createdBy', 'name email')
      .populate('contributors', 'name email')
      .exec(function(err,project) {
        if(err){
          console.log(err);
        }else{
          console.log(project);
          res.render('project-page', {
            title: project.projectName,
            projectName: project.projectName,
            tasks: project.tasks,
            createdBy: project.createdBy,
            projectID: req.params.id
          });
        }
      });
    }else{
      res.redirect('/user');
    }
  }
};

// GET project edit form
exports.edit = function(req, res){
  var strProjectName = '',
      strTasks = '',
      arrErrors = [];
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.params.id) {
      Project.findById( req.params.id, function(err,project) {
        if (err){
          console.log(err);
          res.redirect( '/user?err=project404' );
        } else {
          if (req.session.tmpProject) {
            strProjectName = req.session.tmpProject.projectName;
            req.session.tmpProject = '';
          } else {
            strProjectName = project.projectName;
          }
          if (req.query){
            if (req.query.projectName === 'invalid'){
              arrErrors.push('Please enter a valid project name, minimun 5 characters');
            }
          }

          res.render('project-form', {
            title: 'Edit project',
            userid: req.session.user._id,
            userName: req.session.user.name,
            projectID: req.params.id,
            projectName: strProjectName,
            buttonText: 'Make the change!',
            errors: arrErrors
         });
        }
      });
    }else{
      res.redirect('/user?err=no-projectID');
    }
  }
};

// POST project edit form
exports.doEdit = function(req, res) {
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.body.projectID) {
      Project.findById( req.body.projectID,
        function (err, project) {
          if(!err){
            project.projectName = req.body.projectName;
            // project.modifiedOn = Date.now();
            project.save(function (err, project){
              var qstring = '?';
              if(err){
                console.log(err);
                if (err.name === "ValidationError") {
                  for (var input in err.errors) {
                    qstring += input + '=invalid&';
                    console.log(err.errors[input].message);
                  }
                }else{
                  res.redirect('/?error=true');
                }
                req.session.tmpProject = { "projectName": req.body.projectName};
                res.redirect('/project/edit/' + req.body.projectID + qstring);
              } else {
                console.log('Project updated: ' + req.body.projectName);
                res.redirect( '/project/' + req.body.projectID );
              }
            });
          }
        }
      );
    }
  }
};

// GET Projects by UserID
exports.byUser = function (req, res) {
  console.log("Getting user projects");
  if (req.params.userid){
    Project.findByUserID(req.params.userid, function (err, projects) {
      if(!err){
        console.log(projects);
        res.json(projects);
      }else{
        console.log(err);
        res.json({"status":"error", "error":"Error finding projects"});
      }
    });
  }else{
    console.log("No user id supplied");
    res.json({"status":"error", "error":"No user id supplied"});
  }
};

// GET project delete confirmation form
exports.confirmDelete = function(req, res){
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.params.id) {
      Project.findById( req.params.id, function(err,project) {
        if(err){
          console.log(err);
          res.redirect('/project/' + req.params.id);
        }else{
          res.render('project-delete-form', {
            title: "Delete " + project.projectName + "?",
            projectName: project.projectName,
            projectID: req.params.id,
            userID: req.session.user._id
          });
        }
      });
    }else{
      res.redirect('/user');
    }
  }
};

// POST project delete form
exports.doDelete = function(req, res) {
  if (req.body.projectID) {
    Project.findByIdAndRemove(
      req.body.projectID,
      function (err, project) {
        if(err){
          console.log(err);
          return res.redirect('/project/' + req.body.projectID + '?error=deletion');
        }
        console.log("project id " + project._id + " deleted");
        res.redirect('/user?confirm=project-deleted');
      }
    );
  }
};

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//          START 'TASK' FUNCTIONS
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// GET task creation form
exports.createTask = function(req, res){
  var strTaskName = '',
      strTaskDesc = '',
      arrErrors = [];
  if (req.session.loggedIn === true){

    Project.findById(
      req.params.id, 'projectName', function(err,project) {
        if(err){
          console.log(err);
          res.redirect('/user');
        } else {
          if (req.session.tmpTask) {
            strTaskName = req.session.tmpTask.taskName;
            strTaskDesc = req.session.tmpTask.taskDesc;
            req.session.tmpTask = '';
          }
          if (req.query){
            if (req.query.taskName === 'invalid'){
              arrErrors.push('Please enter a valid task name, minimum 5 characters');
            }
          }

          res.render('task-form', {
            title: 'Add task to project',
            userid: req.session.user._id,
            projectID: req.params.id,
            projectName: project.projectName,
            taskID: '',
            taskName: strTaskName,
            taskDesc: strTaskDesc,
            buttonText: 'Add it!',
            errors: arrErrors
         });

        }
      }
    );

  }else{
    res.redirect('/login');
  }
};

// POST task creation form
exports.doCreateTask = function(req, res) {
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.body.projectID) {
      Project.findById( req.body.projectID, 'tasks modifiedOn',
        function (err, project) {
          if(!err){
            project.tasks.push({
              taskName: req.body.taskName,
              taskDesc: req.body.taskDesc,
              createdBy: req.session.user._id
            });
            // project.modifiedOn = Date.now();
            project.save(function (err, project){
              var qstring = '?';
              if(err){
                console.log('Oh dear', err);
                if (err.name === "ValidationError") {
                  for (var input in err.errors) {
                    qstring += err.errors[input].path + '=invalid&';
                    console.log(err.errors[input].message);
                  }
                }else{
                  res.redirect('/?error=true');
                }
                req.session.tmpTask = { "taskName": req.body.taskName, "taskDesc": req.body.taskDesc };
                res.redirect('/project/' + req.body.projectID + '/task/new' + qstring);
              } else {
                console.log('Task saved: ' + req.body.taskName);
                res.redirect( '/project/' + req.body.projectID );
              }
            });
          }
        }
      );
    }
  }
};

// GET task edit form
exports.editTask = function(req, res){
  var strTaskName = '',
      strTaskDesc = '',
      arrErrors = [];
  if (req.session.loggedIn === true){
    if (req.params.id && req.params.taskID){

      Project.findById(
        req.params.id, 'projectName tasks', function(err,project) {
          if(err){
            console.log(err);
            res.redirect('/user');
          } else {
            var thisTask = project.tasks.id(req.params.taskID);
            strTaskName = thisTask.taskName;
            strTaskDesc = thisTask.taskDesc;

            if (req.session.tmpTask) {
              strTaskName = req.session.tmpTask.taskName;
              strTaskDesc = req.session.tmpTask.taskDesc;
              req.session.tmpTask = '';
            }

            if (req.query){
              if (req.query.taskName === 'invalid'){
                arrErrors.push('Please enter a valid task name, minimum 5 characters');
              }
            }

            res.render('task-form', {
              title: 'Edit task details',
              userid: req.session.user._id,
              projectID: req.params.id,
              projectName: project.projectName,
              taskID: req.params.taskID,
              taskName: strTaskName,
              taskDesc: strTaskDesc,
              buttonText: 'Change it!',
              errors: arrErrors
           });

          }
        }
      );
    } else {
      res.redirect( '/user' );
    }
  }else{
    res.redirect('/login');
  }
};

// POST task edit form
exports.doEditTask = function(req, res) {
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.body.projectID && req.body.taskID) {
      Project.findById( req.body.projectID, 'tasks modifiedOn',
        function (err, project) {
          if(err){
            console.log(err);
            res.redirect( '/user' );
          } else {
            var thisTask = project.tasks.id(req.params.taskID);
            if (!thisTask) {
              res.redirect( '/project/' + req.body.projectID );
              console.log('Task not found: ' + req.params.taskID);
            } else {
              thisTask.taskName = req.body.taskName;
              thisTask.taskDesc = req.body.taskDesc;
              // thisTask.modifiedOn = Date.now();
              // project.modifiedOn = Date.now();

              project.save(function (err, project){
                var qstring = '?';
                if(err){
                  console.log('Oh dear', err);
                  if (err.name === "ValidationError") {
                    for (var input in err.errors) {
                      qstring += err.errors[input].path + '=invalid&';
                      console.log(err.errors[input].message);
                    }
                  }else{
                    res.redirect('/?error=true');
                  }
                  req.session.tmpTask = { "taskName": req.body.taskName, "taskDesc": req.body.taskDesc };
                  res.redirect('/project/' + req.body.projectID + '/task/edit/' + req.body.taskID + qstring);
                } else {
                  console.log('Task updated: ' + req.body.taskName);
                  res.redirect( '/project/' + req.body.projectID );
                }
              });
            }
          }
        }
      );
    } else {
      // if projectID or taskID don't exist
      res.redirect( '/user' );
    }
  }
};


// GET task delete confirmation form
exports.confirmDeleteTask = function(req, res){
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.params.id && req.params.taskID) {
      Project.findById( req.params.id, 'projectName tasks', function(err,project) {
        if(err){
          console.log(err);
          res.redirect('/user');
        }else{
          var thisTask = project.tasks.id(req.params.taskID);
          if (thisTask){
            res.render('task-delete-form', {
              title: "Delete " + thisTask.taskName + "?",
              projectName: project.projectName,
              projectID: req.params.id,
              userID: req.session.user._id,
              taskID: req.params.taskID,
              taskName: thisTask.taskName
            });
          } else {
            res.redirect('/project/' + req.params.id);
          }
        }
      });
    }else{
      res.redirect('/user');
    }
  }
};

// POST task delete form
exports.doDeleteTask = function(req, res) {
  if (req.body.projectID && req.body.taskID) {
    Project.findById(
      req.body.projectID,
      'tasks',
      function (err, project) {
        if(err){
          console.log(err);
          res.redirect('/user');
        }else{
          project.tasks.id(req.body.taskID).remove();
          project.save(function (err) {
            if(err){
              console.log(err);
              res.redirect('/project/' + req.body.projectID);
            } else {
              console.log("task id " + req.body.taskID + " deleted");
              res.redirect('/project/' + req.body.projectID + '?confirm=task-deleted');
            }
          });
        }
      }
    );
  } else {
    res.redirect('/user');
  }
};

