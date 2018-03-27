// load the needed models
var Stage = require('../models/model.stage.serverside');


module.exports = {

    getAll: function (req, res) {
        // use mongoose to get all users in the database
        Stage.find({},{_id:false},function (err, stages) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.status(200).send(stages); // return all users in JSON format
        });
    }

}
