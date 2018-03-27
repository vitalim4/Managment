// load mongoose since we need it to define a model
var mongoose = require('mongoose');

// Create the Project Schema.
module.exports = mongoose.model('ProjectFlow', {
College: {
    Name: {type: String},
    Slug: {type: String}

},
Department: {
    Name: {type: String},
    Slug: {type: String}
},
Type: {
    Name: {type: String},
    Slug: {type: String}
},
Stage: [
    {
        Name: {type: String},
        Slug: {type: String},
        stDescription: {type: String},
        StartDate: Date,
        DueDate: Date,
        Order: Number,
        directions: {type: String},
        percentInProject:{type:Number},
        Status: {
            Name: {type: String},
            Slug: {type: String}
        }
    }
]


}, 'projectflows');