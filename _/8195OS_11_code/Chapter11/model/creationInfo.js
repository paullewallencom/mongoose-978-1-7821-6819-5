var mongoose = require( 'mongoose' );

module.exports = exports = function creationInfo (schema, options) {
  schema.add({createdOn: { type: Date, default: Date.now }});
  schema.add({createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}});
};
