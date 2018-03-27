// load mongoose since we need it to define a model
var mongoose = require('mongoose');

// Create the Notification Schema.
module.exports = mongoose.model('Notification', {
    projectId :  {type: String},
    fromUserId: [{type:String}],
    toUserId: [{type:String}],
    title :  {type: String},
    text :  {type: String},
    isRead:  {type: Boolean, default:false},
    sendDate:  {type: Date},
    readDate:  {type: Date}
});

