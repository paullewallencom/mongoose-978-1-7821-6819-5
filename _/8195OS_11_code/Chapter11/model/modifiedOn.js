module.exports = exports = function modifiedOn (schema, options) {
  schema.add({ modifiedOn: Date });

  schema.pre('save', function (next) {
    this.modifiedOn = Date.now();
    next();
  });
};