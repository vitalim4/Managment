// load the needed models
var Status = require('../models/model.status.serverside');


module.exports = {

    getAll: function (req, res) {
        // use mongoose to get all users in the database
        Status.find({},{_id:false},function (err, statuses) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            res.status(200).send(statuses); // return all users in JSON format
        });
    }

};
