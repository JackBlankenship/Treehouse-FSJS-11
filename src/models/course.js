var mongoose = require('mongoose');
//var User = require("./user.js");
//var Review = require("./review.js");
var Schema = mongoose.Schema;
var CourseSchema = new mongoose.Schema({
    user: {			// tied to the users collection.
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
    	type: String,
    	trim: true
    },
    estimatedTime: {
    	type: String,
    	trim: true
    },
    materialsNeeded: {
    	type: String,
    	trim: true
    },
    steps: {
    	type: [{ 
    		stepNumber: Number, 
    		title: {
    			type: String,
    			required: true
    			}, 
    		description: {
    			type: String,
    			required: true
    			}
    		}],
    }, 
    reviews: [ { type: Schema.Types.ObjectId, ref: 'Review'}]
});

CourseSchema.pre('save', function (next) {
    var course = this;
    // originally was going to put the self review restriction here. see reviews.js
    //console.log("CourseSchema.pre save - Reviews:" + course.reviews.length)
    next();
});

var Course = mongoose.model('Course', CourseSchema);
module.exports = Course;