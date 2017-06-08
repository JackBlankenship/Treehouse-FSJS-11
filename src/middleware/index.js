User = require("../models/user");
var auth = require('basic-auth');

function loggedOut(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }
  return next();
}
function requiresLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    var err = new Error('You must be logged in to view this page.');
    err.status = 401;
    return next(err);
  }
}
function apiAuthenticate(req, res, next) {
    let userAuth = auth(req);             // so we have added safety logic
    if (!userAuth) {
      var err = new Error("authorization failed")
      err.status = 401;
      return next(err)
    } else {
      User.authenticate(userAuth.name, userAuth.pass, function (error, user) {
        if (error || !user) {
          var err = new Error('Wrong email or password.');
          err.status = 401;
          return next(err);
        }  else {
          req.session.userId = user._id;
        }
        return next();
      });       // end User.authenticate
    }           // end else if (!userAuth)

};
module.exports.apiAuthenticate = apiAuthenticate;
module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;
