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
