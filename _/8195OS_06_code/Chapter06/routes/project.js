var mongoose = require( 'mongoose' );
var Project = mongoose.model( 'Project' );


// GET project creation form
exports.create = function(req, res){
  if (req.session.loggedIn === true){
    res.render('project-form', {
      title: 'Create project',
      userid: req.session.user._id,
      userName: req.session.user.name,
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
          res.redirect('/user?404=project');
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