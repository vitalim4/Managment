// load the needed models
var Year = require('../models/model.year.serverside');


module.exports = {

    getAll: function (req, res) {
        var years=[];
        var currentTime = new Date();
        years.push(currentTime.getFullYear()+3759);
        years.push(currentTime.getFullYear()+3760);
        years.push(currentTime.getFullYear()+3761);
        years.push(currentTime.getFullYear()+3762);
        years.push(currentTime.getFullYear()+3763);
        years.push(currentTime.getFullYear()+3764);
        years.push(currentTime.getFullYear()+3765);
        years.push(currentTime.getFullYear()+3765);
        years.push(currentTime.getFullYear()+3766);
        //console.log(years);
        //Year.find({Slug:{$in:years}},{},function (err, years) {
        Year.find({},{_id:false},function (err, years) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            res.status(200).send(years); // return all users in JSON format
        });
    },
    addYear:function(req,res){
        var yearSlug = req.body.Slug;
        var yearName = req.body.Name;
        yearSlug = parseInt(yearSlug)+ 3760;
            Year.create({Name: yearName, Slug: yearSlug}, function (err, doc) {
                res.send("Record added as "+doc);

            });
    }
};
