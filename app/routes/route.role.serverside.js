// load the needed models
var Role = require('../models/model.role.serverside');


module.exports = {


    getAll: function (req, res) {
        var userType = req.user.Role.Slug;
        var inDepartment = req.user.Department.Slug;
        if (userType==='admin') {
            // use mongoose to get all users in the database
            Role.find({}, {_id: false}, function (err, roles) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(roles); // return all users in JSON format
            });
        }
        else if(userType==='manager')
        {
                // use mongoose to get per permissions
                Role.find({Slug:{$in:['lecturer','student']}},{}, function (err, roles) {

                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err);

                    res.status(200).send(roles); // return all users in JSON format
                });
        }
        else if(userType==='lecturer')
        {
            // use mongoose to get per permissions
            Role.find({Slug:{$in:['student']}},{}, function (err, roles) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(roles); // return all users in JSON format
            });
        }
    },


    getAllForArchive: function (req, res) {
        var userType = req.user.Role.Slug;
        var inDepartment = req.user.Department.Slug;
            // use mongoose to get all users in the database
            Role.find({}, {_id: false}, function (err, roles) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(roles); // return all users in JSON format
            });
    }

}
