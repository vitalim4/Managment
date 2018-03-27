// load mongoose since we need it to define a model
var mongoose = require('mongoose');

// Create the User Schema.
module.exports = mongoose.model('ApproveRequest', {
    projectId :  {type: String},
    projectName : {type: String},
    shortDescription :  {type: String},
    lecturers: [
        {
            id: {type:String},
            name: {type: String}
        }
    ],
    numOfStudents :  {type: Number},
    isApproved:   {type: Boolean},
    reason: {type: String},
    Department: {
        Name: {
            type: String
        }
        ,
        Slug: {
            type: String
        }
    },
    College: {
        Name: {
            type: String
        }
        ,
        Slug: {
            type: String
        }
    },
    Type: {
        Name: {
            type: String
        }
        ,
        Slug: {
            type: String
        }
    },
    creationDate :  {type: Date},
    updateDate:  {type: Date}
});

