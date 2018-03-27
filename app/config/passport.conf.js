// Configuring Passport
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var User = require('../models/model.user.serverside');

module.exports = function (passport) {
// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

//in order to support login sessions, so that every subsequent request will not contain
// the user credentials serialize and deserialize user instance from a session store.

// used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

// used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.find(ObjectId(id), function (err, user) {
            done(err, user);
        });
    });


    passport.use('local-login', new LocalStrategy(
        function (username, password, done) {
            User.findOne({
                Username: username
            }, function (err, user) {
                if (err) throw err;

                if (err) {
                    return done(err);

                }
                if (!user) {
                    return done(null, false);
                } else {
                    if (password) {
                        // check if password matches
                        if (!user.validPassword(password)) {
                            return done(null, false);

                        } else {
                            return done(null, user);
                        }

                    }
                    else {
                        return done(null, false);
                    }
                }
            });
        }
    ));
    return passport;
};