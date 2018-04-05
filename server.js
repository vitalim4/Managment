// set up ========================
const express = require('express'), cors = require('cors');
var fileUpload = require('express-fileupload');
const app = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var fs = require('fs');    // pull information from HTML POST (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var database = require('./app/config/dbConnect');
var path = require('path');
var session = require('express-session');
var config = require('./app/config/sysConfig');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var flash = require('connect-flash');


app.use(cors());


// configuration =================
mongoose.connect(database.url);     // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(cookieParser());

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
// log every request to the console
//app.use(bodyParser.urlencoded({'extended': 'true', uploadDir: path.join(__dirname, 'public', 'uploads')}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
//app.use(bodyParser.json()); // parse application/vnd.api+json as json

app.use('/partials', express.static(__dirname + '/public/partials'));


app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    saveUninitialized: true,
    secret: config.jwtSecret,
    resave: true,
    cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



require('./app/routes')(app);


// Auth Middleware - This will check if the token is valid
// Only the requests that start with /api/v1/* will be checked for the token.
// Any URL's that do not follow the below pattern should be avoided unless you
// are sure that authentication is not needed
app.all('/api/v1/*', [require('./app/middleware/middleware.validaterequest.serverside')]);


// listen (start app with node server.js) ======================================
//app.listen(3000);
//console.log("App listening on port 3000");
app.listen(80);
console.log("App listening on port 80");
