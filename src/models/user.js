var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var validator = require('validator');
var uniqueValidator = require('mongoose-unique-validator');

var UserSchema = new mongoose.Schema({
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    emailAddress: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    }
});

UserSchema.plugin(uniqueValidator);
// authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback) {
  User.findOne({ emailAddress: email })
      .exec(function (error, user) {
        if (error) {
          return callback(error);
        } else if ( !user ) {
          var err = new Error('User not found.');
          err.status = 401;
          return callback(err);
        }
        bcrypt.compare(password, user.password, function(error, result) {
          if (result === true) {
            return callback(null, user);
          } else {
            return callback();
          }
        })
      });
};

// hash password before saving to database
UserSchema.pre('save', function (next) {

  var user = this;
  let validEmail = validator.isEmail(user.emailAddress);
  if (validEmail !== true) {
    let err = new Error("Invalid Email format")
    err.status = 401;
    return next(err);
  }
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });   // end of the bcrypt.hash
});

var User = mongoose.model('User', UserSchema);
module.exports = User;
