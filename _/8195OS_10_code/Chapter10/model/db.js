var mongoose = require( 'mongoose' ),
    dbURI = 'mongodb://localhost/MAPProjectManager';

// Create the database connection
mongoose.connect(dbURI);

// Define connection events
mongoose.connection.on('connected', function () {
  console.log('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error',function (err) {
  console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose disconnected');
});

process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected through app termination');
    process.exit(0);
  });
});

// SHARED VALIDATION FUNCTIONS
var isNotTooShort = function(string) {
  return string && string.length >= 5;
};
// The following two lines will do the same thing
// var validateLength = [isNotTooShort, 'Too short' ];
var validateLength = [{validator: isNotTooShort, msg: 'Too short'} ];

/* ********************************************
      USER SCHEMA
   ******************************************** */

// UExternal email validation object
var validateEmail = [/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, "Invalid email address"];

var userSchema = new mongoose.Schema({
  /* Validate the name referencing a validor object*/
  name: {type: String, required: true, validate: validateLength },
  /* Validate the name inline, calling the function directly*/
  // name: {type: String, required: true, validate: { validator: isNotTooShort, msg: 'Much too short' } },

  /* Validate the email address referencing a validor object */
  email: {type: String, unique:true, required : true, validate: validateEmail },
  /* Validate email with a RegEx validator and custom error message */
  // email: {type: String, unique:true, required : true, validate: { validator: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, msg: 'Invalid email address'} },
  /* Validate email using built-in String match validator (no custom message) */
  // email: {type: String, unique:true, required : true, match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i },

  createdOn: { type: Date, default: Date.now },
  modifiedOn: Date,
  lastLogin: Date,
  projectsMigrated: Boolean
});

// Build the User model
mongoose.model( 'User', userSchema );

/* ********************************************
      PROJECT SCHEMA
   ******************************************** */

var taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true, validate: validateLength },
  taskDesc: String,
  createdOn: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  modifiedOn: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

var projectSchema = new mongoose.Schema({
  projectName: String,
  /* Validate projectName inline calling the function directly */
  // projectName: {type: String, required: true; validate: {validator: isNotTooShort, msg: 'Much too short'}},
  /* Validate projectName by referencing a validator object */
  // projectName: {type: String, required: true; validate: validateLength },

  // createdBy: { type: String},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  createdOn: { type: Date, default: Date.now },
  modifiedOn: Date,
  contributors: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  tasks: [taskSchema]
});

/* Add all projectName validation using schemaType methods, outside of the schema delcaration */
projectSchema.path('projectName').required(true);
projectSchema.path('projectName').validate(isNotTooShort, 'Is too short');
/* Asynchronous validator checking against the database*/
projectSchema.path('projectName').validate(function (value, respond) {
  // if the project has a modifiedOn value pass validation as project already exists 
  if(this.modifiedOn){
    console.log('Validation passed: ', this);
    respond(true);
  }else{
    // Otherwise check to see if this user already has a project with the same name
    console.log('Looking for projects called ' + value);
    Project.find({projectName: value, createdBy: this.createdBy}, function(err, projects){
      console.log('Number found: ' + projects.length);
      respond(projects.length ? false : true);
    });
  }
}, 'Duplicate projectName');

projectSchema.statics.findByUserID = function (userid, callback) {
  this.find({ createdBy: userid }, '_id projectName', {sort: 'modifiedOn'}, callback);
};

// Build the Project model
var Project = mongoose.model( 'Project', projectSchema );
