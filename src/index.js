'use strict';
// load modules
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var seeder = require('mongoose-seeder'),
    data = require('./data/data.json');

var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var User = require('./models/user');
var Review = require('./models/review');
var Course = require('./models/course');

// mongodb connection
mongoose.connect("mongodb://localhost:27017/courserating");
var db = mongoose.connection;
// mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once("open", function (){
	console.log("mongoose connection successful");
	let args = process.argv.slice(2);
	let reload = process.argv.slice(4);
	console.log("Arguments:" + args + " " + reload);
	seeder.seed(data, {dropDatabase: true}).then(function (dbData) {
    	// The database objects are stored in dbData.users dbData.reviews dbData.courses
    	console.log("Data has been seeded");
	}).catch(function (err, next) {
    	console.log("mongoose-seeder failed:", err);
    	next(err);
	});
});

var app = express();

// set our port
app.set('port', process.env.PORT || 5000);

// morgan gives us http request logging
app.use(morgan('dev'));

// use sessions for tracking logins
app.use(session({
  secret: 'treehouse loves you',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// make user ID available in templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.userId;  // might need to be Authentication instead of currentUser
  next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
var routes = require('./routes/index');
app.use('/', routes);

// catch 404 and forward to global error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// Express's global error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({message: err.message});       // no pages for an API to return, we send json data back.
  //res.render('error', {
  //  message: err.message,
  //  error: {}
  //});
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);
});
