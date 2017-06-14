var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Course = require('../models/course');
var Review = require('../models/review');
var mid = require('../middleware');

// Project 11 TODOS build basic pug views and error page.
// EXTRA CREDIT
// 10. Review Model - Validation added to prevent a user from reviewing their own course

// COMPLETED
// 01. GET /api/courses 200 - Returns the Course "_id" and "title" properties
// 02. GET /api/course/:courseId 200 - Returns all Course properties and related documents for the provided course ID
// more 02. When returning a single course for the GET /api/courses/:courseId route, use Mongoose population to load the related user and reviews documents.
// 03. POST /api/courses 201 - Creates a course, sets the Location header, and returns no content
// 04. PUT /api/courses/:courseId 204 - Updates a course and returns no content
// 05. POST /api/courses/:courseId/reviews 201 - Creates a review for the specified course ID, sets the Location header to the related course, and returns no content
// 06. Update any POST and PUT routes to return Mongoose validation errors
// 6a. Use the next function in each route to pass any Mongoose validation errors to Express’s global error handler
// 6b. Send the Mongoose validation error with a 400 status code to the user
// 07. Update the User model to store the user's password as a hashed value
// 7a. For security reasons, we don't want to store the password property in the database as clear text.
// 7b. Create a pre save hook on the user schema that uses the bcrypt npm package to hash the user's password.
// 08. Create an authentication method on the user model to return the user document based on their credentials
// 8a. Create a static method on the user schema that takes an email, password, and callback
// 8b. The method should attempt to get the user from the database that matches the email address given
// 8c. If a user was found for the provided email address, then check that user's password against the password given using bcrypt.
// 8d. If they match, then return the user document that matched the email address
// 8e. If they don't match or a user with the email given isn’t found, then pass an error object to the callback// 09. Set up permissions to require users to be signed in
// 9a. Postman will set an Authorization header with each request when a user is signed in.
// 9b. Add a middleware function that attempts to get the user credentials from Authorization header set on the request.
// 9c. You can use the basic-auth npm package to parse the `Authorization' header into the user's credentials.
// 9d. Use the authenticate static method you built on the user schema to check the credentials against the database
// 9e. If the authenticate method returns the user, then set the user document on the request so that each following middleware function has access to it.
// 9f. If the authenticate method returns an error, then pass it to the next function
// 9g. Use this middleware in the following routes
//    POST /api/courses
//    PUT /api/courses/:courseId
//    GET /api/users
//    POST /api/courses/:courseId/reviews

// EXTRA CREDIT
// 11. USER ROUTES - Tests have been written for the following user stories
//  a. When I make a request to the GET route with the correct credentials, the corresponding user document is returned
//  b. When I make a request to the GET /api/courses/:courseId route with the invalid credentials, a 401 status error is returned
// 12. Course routes
//    When returning a single course for the GET /api/courses/:id route, use Mongoose deep population to load only the 
//    fullName of the related user on the course model and the review models. See the Project Resources section for more information about deep population.

//router.param("courseId", function (req, res, next, id ) {
//
//});

// GEt all courses route
router.get('/api/courses', function (req, res, next) {
  console.log("route get /api/courses")
  Course.find({})
    .select('_id title')
    .exec( function (err, course) {
      if (err) return next(err);
      res.status(200).json(course)
    });
});

// GET single course for EXTRA CREDIT mid.apiAuthenticate
router.get('/api/courses/:courseId', mid.apiAuthenticate, function (req, res, next) {
  console.log("route get /api/courses/:courseId")
  Course.findById(req.params.courseId)
    .populate('user', '_id fullName')                 // only show the related _id and fullName from Users
    .populate({ 
      path: 'reviews',
      populate: { path: 'user', select: 'fullName'}   // only show _id and fullName from Users
      })                                              // populate all fields from Review into reviews array.
    .exec( function (err, doc) {
      console.log("exec course.findByID")
      if (err) return next(err);
      if (!doc) {
        let errDoc = new Error("course not Found");
        errDoc.status = 404;
        return next(errDoc);
      } else {
       req.course = doc;
       res.status(200).json(req.course);
      };
    });       // end Course.findByID().exec
    
});

router.post('/api/courses', mid.apiAuthenticate, function (req, res, next) {
  let course = new Course(req.body);
  course.save(function (err, course) {
    if (err) {
      err.status = 400;
      return next(err);
    }
    res.setHeader("Location", "/");           // you have to set the header first, it will not chain correctly
    res.status(201).json({});                 // you have to return a null json object or the response hangs. go figure.
  });
});
//TODO not working on the course update.
router.put('/api/courses/:courseId', mid.apiAuthenticate, function (req, res, next) {
  console.log("course udpate route for:" +  Object.getOwnPropertyNames(req.body));
  Course.findById(req.params.courseId)
    .exec(function (err, course) {
      if (course) {                   // tried to use course(req.body) below, but that did not behave correctly
        if (req.body.title) course.title = req.body.title;
        if (req.body.description) course.description = req.body.description;
        if (req.body.estimatedTime) course.estimatedTime = req.body.estimatedTime;
        if (req.body.materialsNeeded) course.materialsNeeded = req.body.materialsNeeded;
        if (req.body.steps) course.steps = req.body.steps;
        course.save( function (err, course) {
          if (err) return next(err)
        });
        res.status(204).json({});
      } else {
        let err = new Error("course not Found");
        err.status = 404;
        return next(err);
      }
    });
});

router.post('/api/courses/:courseId/reviews', mid.apiAuthenticate, function (req, res, next){
  Course.findById(req.params.courseId)
    .exec(function (err, course) {
      if (course) {
        let review = new Review(req.body);
        review.user = req.session.userId;
        course.reviews.push(review)             // says this should work from mongoosejs.com/docs/subdocs.html
        course.save( function (err, course) {   // course save first to populate the reviews array
          if (err) return next(err)
          review.save( function (err, review) { // review save second so that the pre save validation works.
            if (err) return next(err)           // does not look like we have to do a course.reviews.remove();
            res.setHeader("Location", "/api/courses/" + req.params.courseId)
            res.status(201).json({});
          });     // end review.save
        });       // end course.save
      } else {
        let err = new Error("Course not found")
        err.status = 404;
        next(err);
      }
    });   // end Course.findById

});

router.get('/api/users', mid.apiAuthenticate, function (req, res, next) {
    User.find({_id: req.session.userId})
      .exec(function (err, user) {
        if (err) return next(err)
          if (user) {
            return res.status(200).json(user)
          } else {
            let err = new Error("No user found for")
            return res.status(404)
          }
      })
});


router.post('/api/users', function (req, res, next) {
  let newUser = new User(req.body);
  newUser.save( function (err, newUser) {
    if (err) { 
      return next(err);
    } else {
      res.setHeader("Location", "/")
      res.status(201).json({});
    }
  });     // end of the new user create.
});

module.exports = router;
