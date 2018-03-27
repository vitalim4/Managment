// load mongoose since we need it to define a model
var mongoose = require('mongoose');
var departmentSchema = require('./model.department.serverside');
var collegeSchema = require('./model.college.serverside');
var roleSchema = require('./model.role.serverside');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// Create the User Schema.
var userSchema = new mongoose.Schema({
    firstName: {type: String},
    lastName: {type: String},
    Email: {type: String},
    Department:{
        Name: {type: String},
        Slug: {type: String}
    },
    Semester:{
        Name: {type: String},
        Slug: {type: String}
    },
    Year:{
        Name: {type: String},
        Slug: {type: String}
    },
    College: {
        Name: {type: String},
        Slug: {type: String}
    },
    Role:{
        Name: {type: String},
        Slug: {type: String}
    },
    Phone: {type: String},
    Birthday: {type: Date},
    Username: {type: String},
    Password: {type: String},
    inProcess: {type: Boolean},
    inGroup: {type: Boolean},
    gender: {type: Boolean},
    resetPasswordToken: {type: String, required: false},
    resetPasswordExpires: {type: Date, required: false}
});

userSchema.pre('save', function (next) {
    var user = this;
    var SALT_FACTOR = 5;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});


// checking if password is valid
userSchema.methods.validPassword = function (password) {
    var hash = bcrypt.hashSync(this.Password);

    var passCMPRes = bcrypt.compareSync(password, hash);

    return passCMPRes;
};


// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('user', userSchema);


// make this available to our users in our Node applications
module.exports = User;