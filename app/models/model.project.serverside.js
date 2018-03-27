// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// create a schema
var projectSchema = new Schema({
    nameHeb: {type: String},
    nameEng: {type: String},
    projDescrip: {type: String},
    shortDescription: {type: String},
    neededKnowledge: {type: String},
    literatureSources: {type: String},
    professionalGuide: {type: String},

    picUrl: {type: String, default: ""},
    isPaired: {type: Boolean},
    waitingApproval: {type: Boolean},
    isInProcess: {type: Boolean},
    tags:[{text:{type: String}}],
    curState: {
        curStatus: {type: String},
        curStage: {type: String},
        curOrder: {type: Number}
    },

    lecturers: [
        {
            id: {type: String},
            name: {type: String},
            email: {type: String}
        }
    ],
    students: [
        {
            id: {type: String},
            name: {type: String},
            email: {type: String}
        }
    ],
    flow: {
        Stage: [{
            Name: {type: String},
            Slug: {type: String},
            stDescription: {type: String},
            directions: {type: String},
            StartDate: Date,
            DueDate: Date,
            Order: Number,
            percentInProject:{type:Number},
            Submission:{
                Path: {
                    type: String, default: ""
                },
                SubmissionDate: {
                    type: Date
                },
                Grade: {
                    type: Number, default: -1
                },
                GradeDate: {
                    type: String, default: ""
                },
                Open: {
                    type: Boolean, default: false
                },                LecturerComments:{
                    type: String, default: ""
                },
                LecturerId:{
                    type: String, default: ""
                }
            },
            Status: {
                Name: {type: String},
                Slug: {type: String}
            }
        }
        ],
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
        }
    },

    createdDate: {
        type: Date
    }
    ,
    lastModified: {
        type: Date
    },
    Semester: {
        Name: {
            type: String
        }
        ,
        Slug: {
            type: String
        }
    },
    Year: {
        Name: {
            type: String
        }
        ,
        Slug: {
            type: String
        }
    }
});


// the schema is useless so far
// we need to create a model using it
var Project = mongoose.model('Project', projectSchema);

// make this available to our users in our Node applications
module.exports = Project;
