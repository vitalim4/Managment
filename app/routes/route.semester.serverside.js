// load the needed models
var Semester = require('../models/model.semester.serverside');


module.exports = {

    getAll: function (req, res) {
        Semester.find({},{_id:false},function (err, semesters) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            res.status(200).send(semesters); // return all users in JSON format
        });
    }

};
