// load mongoose since we need it to define a model
var mongoose = require('mongoose');

// Create the Role Schema.
module.exports = mongoose.model('Semester', {
    Name : {type: String},
    Slug :  {type: String}
}, 'semesters');

