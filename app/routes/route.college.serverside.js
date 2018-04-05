// load the needed models
var College = require('../models/model.college.serverside');

module.exports = {

    getAll: function (req, res) {
        var userType = req.user.Role.Slug;
        var inCollege = req.user.College.Slug;
        //console.log(req.user.College.Slug)
        // use mongoose to get all colleges in the database
        if(userType==='admin')
        {
            College.find({},{_id:false},function (err, colleges) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(colleges); // return all users in JSON format
            });
        }
        else if(userType==='lecturer'){
            College.find({},{_id:false},function (err, colleges) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(colleges); // return all users in JSON format
            });
        }
        else
        {
            College.find({Slug:inCollege},{},function (err, departments) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(departments); // return all users in JSON format
            });
        }

    },
    getAllForArchive: function (req, res) {
        var userType = req.user.Role.Slug;
        var inCollege = req.user.College.Slug;
        //console.log(req.user.College.Slug)
        // use mongoose to get all colleges in the database
            College.find({},{_id:false},function (err, colleges) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.status(200).send(colleges); // return all users in JSON format
            });
    }

}
