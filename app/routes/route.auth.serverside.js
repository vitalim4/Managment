var userRoute = require('../routes/route.user.serverside');
var Project = require('../models/model.project.serverside');
var User = require('../models/model.user.serverside');
var mongoose = require('mongoose');
var moment = require('moment');
var crypto = require('crypto');
var jwt = require('jwt-simple');


var auth = {


    login: function (req, res) {
        var username = req.body.username || '';
        var password = req.body.password || '';

        if (username == '' || password == '') {
            res.status(401);
            res.json({
                "status": 401,
                "message": "Invalid credentials"
            });
            return;
        }

        password = crypto.createHash('sha256').update(password).digest('hex');
        var resultUser = userRoute.login(username, password, function (error, resUser) {
                if (error != null) {
                    res.statusMessage = error;
                    res.status(400).send({data: null}
                    );
                }
                else {
                    if (!resUser) {
                        res.status(401);
                        res.json({
                            "status": 401,
                            "message": "נא לוודא פרטים ולנסות מחדש"
                        });
                        return;
                    }
                    else {
                        console.log(genToken(resUser));
                        // If authentication is success, we will generate a token
                        // and dispatch it to the client
                        res.json(genToken(resUser));
                    }

                }
            }
            )
            ;

    },

    validateUser: function (iuserId) {
        var ObjectId = mongoose.Types.ObjectId;
        var userId = new ObjectId(iuserId);
        var dbUserObject = {};

        var GetMyUser = function (err, dbUser) {
            dbUserObject = dbUser;
            console.log(dbUserObject);
        }

        User.findById(userId, GetMyUser);


        return dbUserObject;


    }
    ,
}

// private method
function genToken(user) {
    var expires = moment().add(6, 'hours').valueOf();
    var token = jwt.encode({
        exp: expires
    }, require('../config/secret')());

    return {
        token: token,
        expires: expires,
        user: user
    };



}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;