// load the needed models
var ProjectFlow = require('../models/model.projectflow.serverside');

module.exports = {

    getColleges: function (req, res) {
        // use mongoose to get all colleges in the database

        ProjectFlow.aggregate([
                {"$group": { "_id": { College: "$College"} } }
            ],
            function (err, colleges) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    return res.send(err)

                 return res.json(colleges); // return all departments in JSON format
            }
        );
    },


    getDepartments: function (req, res) {
        // use mongoose to get all users in the database
        var inCollege = req.user.College.Slug;
        ProjectFlow.find
        (
            {"College.Slug": inCollege},
            {"College.Department.Name": 1, "College.Department.Slug": 1},
            {},
            function (err, deps) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                res.json(deps); // return all departments in JSON format
            }
        );
    },


    getTypes: function (req, res) {
        // use mongoose to get all users in the database
        var inCollege = req.user.College.Slug;
        var inDepartment = req.user.Department.Slug;


        ProjectFlow.find
        (
            {"College.Slug": inCollege, "Department.Slug": inDepartment},
            {'Type':1},
            {},
            function (err, deps) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err);

                res.json(deps); // return all departments in JSON format
            }
        );
    },

    getTypesAsStrings: function (req, res) {
        // use mongoose to get all users in the database
        var inCollege = req.params.collegeslug;
        var inDepartment = req.params.departmentslug;


        ProjectFlow.aggregate([
            {$match: {$and: [{"Department.Slug": inDepartment}, {"College.Slug": inCollege}]}},
            {"$project": {"Type": 1}},
            {"$unwind": "$Type"},
            {"$group": {"_id": "$Type.Name"}}
        ], function (err, types) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(types);
        });
    },


    getFlow: function (req, res) {
        // use mongoose to get all users in the database
        var inCollege = req.params.collegeslug;
        var inDepartment = req.params.departmentslug;
        var inType = req.params.typeslug;
        ProjectFlow.find
        (
            {"College.Slug": inCollege, "Department.Slug": inDepartment, "Type.Slug": inType},
            {},
            {},
            function (err, flow) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    return res.send(err);

                result = flow;

                res.json(result); // return all departments in JSON format
            }
        );
    },

    getStages: function (req, res) {
        // use mongoose to get all users in the database
        var inCollege = req.params.collegeslug;
        var inDepartment = req.params.departmentslug;
        var inType = req.params.typeslug;
        var inStatus = req.params.statusslug;
        ProjectFlow.find
        (
            {
                "College.Slug": inCollege,
                "College.Department.Slug": inDepartment,
                "College.Department.Type.Slug": inType,
                "College.Department.Type.Status.Slug": inStatus
            },
            {"College.Department.Type.Status.Stage.Name": 1, "College.Department.Type.Status.Stage.Slug": 1},
            {},
            function (err, deps) {
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)

                res.json(deps); // return all departments in JSON format
            }
        );
    },

}