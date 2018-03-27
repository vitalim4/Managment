// load mongoose since we need it to define a model
var mongoose = require('mongoose');

// Create the User Schema.
module.exports = mongoose.model('College', {
    Name : {type: String},
    Slug :  {type: String}
}, 'colleges');

