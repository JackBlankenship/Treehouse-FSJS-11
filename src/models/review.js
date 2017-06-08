var mongoose = require('mongoose');
var Course = require("./course");
//var User = require('./user.js');
var Schema = mongoose.Schema;
var ReviewSchema = new mongoose.Schema({
    user: {			
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    postedOn: {
      type: Date,
      default: Date.now
    },
    rating: {
    	type: Number,
    	required: true,
    	min: 1,
    	max: 5
    },
    review: { 
    	type: String
    }
});
ReviewSchema.pre('validate', function (next) {
  // user can not be the same as the course.user
  // currently being done /routes/index.js router.post('/api/courses/:courseId/reviews'
    review = this;
    /*Course.findOne({ reviews: review._id})
    .exec( function (err, course) {
      if (err) next(err)
      if (course) {
        if (review._id === course.user) {
          console.log("Error, can not review own course")
        } else {
          console.log("may need to be pre save?")
        }
      }
    })
*/
    next();
});

ReviewSchema.pre("save", function (next) {
    review = this;
    Course.findOne({ reviews: review._id})
    .select('user reviews')
    .exec( function (err, course) {
      if (err) next(err)
      if (course) {
        if (review.user.toString() === course.user.toString()) {
          let err = new Error("Can not review own course")
          err.status = 503;
          return next(err);
        } else {
          next();
        }
      } else {
        next();
      }
    })

});
var Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;