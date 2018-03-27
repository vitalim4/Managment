// load the needed models
var Department = require('../models/model.department.serverside');

module.exports = {

    getAll: function (req, res) {
        var userType = req.user.Role.Slug;
        var inDepartment = req.user.Department.Slug;
        if(userType==='admin')
        {
            Department.find({},{_id:false},function (err, departments) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(departments); // return all users in JSON format
            });
        }
        else
        {
            Department.find({Slug:inDepartment},{},function (err, departments) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(departments); // return all users in JSON format
            });
        }

    }


};
