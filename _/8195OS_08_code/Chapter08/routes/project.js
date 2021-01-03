var mongoose = require( 'mongoose' );
var Project = mongoose.model( 'Project' );


// GET project creation form
exports.create = function(req, res){
  if (req.session.loggedIn === true){
    res.render('project-form', {
      title: 'Create project',
      userid: req.session.user._id,
      userName: req.session.user.name,
      projectID: '',
      projectName: '',
      tasks: '',
      buttonText: 'Make it so!'
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
    createdOn : Date.now(),
    tasks : req.body.tasks
  }, function( err, project ){
    if(err){
      console.log(err);
      res.redirect('/?error=project');
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
      Project.findById( req.params.id, function(err,project) {
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
  if (req.session.loggedIn !== true){
    res.redirect('/login');
  }else{
    if (req.params.id) {
      Project.findById( req.params.id, function(err,project) {
        res.render('project-form', {
          title: 'Edit project',
          userid: req.session.user._id,
          userName: req.session.user.name,
          projectID: req.params.id,
          projectName: project.projectName,
          tasks: project.tasks,
          buttonText: 'Make the change!'
       });
      });
    }else{
      res.redirect('/user');
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
            project.tasks = req.body.tasks;
            project.modifiedOn = Date.now();
            project.save(function (err, project){
              if(err){
                console.log(err);
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
