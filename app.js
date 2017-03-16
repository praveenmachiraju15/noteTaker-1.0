// /**

//  * Created by Ahmed Ahmed on 2/22/2017.
//  */
var multer = require('multer');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var express = require('express');
var app = express();
var expressSession = require('express-session');
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require('path'); //for body paths, this is a core npm module
var expressValidator = require('express-validator'); //for page validation module -  the express-validator
var mongojs = require('mongojs');
var db = mongojs('mynotes', ['users'],['notes']);
var jquery = require('jquery');
var router = require('./router')(app); //use the routes in routes.js files (interesting Syntax)

var upload = multer();
module.exports = app; //also part of redirecting routes

// //the following lines are bodyParser middleware... dont need to know in detail
app.use(bodyParser.json());//this makes parsing JSON possible
app.use(bodyParser.urlencoded({extended: false})); // Why false?


// //express validator middleware as copied from GitHub
app.use(expressValidator({ //dont worry about what this says just collapse this so that it wont intimidate you
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.')
    , root    = namespace.shift()
    , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// //now setting a static path to use thoughout the project
//app.use(express.static(path.join(__dirname, 'public')))

app.use('/public', express.static(path.join(__dirname + '/public/')));

//adding JavaScript Files that are used within EJS files as a static path
app.use('/scripts',express.static(path.join(__dirname, '/scripts')))

app.use(cookieParser());
app.use(session({secret: "sheeee"}));
app.use(upload.array());  // this is for multer


// //Setting global variables
app.use(function(req,res,next){ //of you are gonna make any global vars (vars that you may use em later int he life of the project add them here the same as the syntax you see)

  res.locals.errors = null;
  res.locals.result = null;
  if (!req.user)
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next()

});

//setting the view engine
app.set('view engine','ejs') //setting the view engine as 'ejs'
app.set('views',path.join(__dirname,'views'))//view paths will be taken from '__dirname/views'

app.listen(8080,function(){
  console.log("Initializing Server.... Listening at 8080")
});

app.get('/',function(req,res){
  res.render("index",{success: false, errors: req.session.errors});
  req.session.errors = null;
});

app.get('/about',function(req,res){
  res.render("about");
});

app.post('/',function(req,res,next){

})


app.get('/mainlogin',function(req,res){ //gives the login page
  res.render("services")
});

function checkSignIn(req, res, next){
  if(req.session.user){
        next();     //If session exists, proceed to page
      } else {
        var err = new Error("Not logged in!");
        console.log(req.session.user);
        next(err);  //Error, trying to access unauthorized page! // Make it look pretty Here
      }
    }

app.get('/protected_page', checkSignIn, function(req, res){

  db.notes.find({username:req.session.user.username},function(err,docs){
    console.log("Got the note!")
    res.render('protected_page', {
      user : req.session.user.firstname,
      savestatus:"Here you can save notes",
      savestatus: "Error saving note...",
      savestatus: "Note Saved Successfully!",
      notes:docs
    }) 
  })
});



app.post('/Login',function(req,res,next){ // receives the data from the login page
  console.log("Authenticating User")
    authenticate(req,res) // to check with the DB and see if the login is valid with the given details
  });

function authenticate(req,res){
  console.log("Im in the function")

    username  = req.body.username; //the username and password as received from the index page
    password = req.body.password;
    console.log("The username:  " + username)

    db.users.findOne({username: username,password: password},function(err,doc){ //findOne() method used in MongoDB, sent in with MongoJS
      if(err){
        throw err;
      }  if(doc && doc._id){
        if(password==doc["password"]){
          req.session.user = doc;
          console.log(req.session.user.firstname)      
          res.redirect("/protected_page")
        }else{
          res.send("Invalid login")
        }
      }else{
        res.send("Invalid login")
      }
    });
  }
  //sessions kida has a role to play at the above method...so look into it and understand it

  app.post('/savenote',function(req,res){

    console.log("Im in the notesaving POST")
    var note = req.body.note;
    var username = req.session.user.username;

    db.notes.insert({username: username, note:note},function(err,result){

      if(err){
        console.log("Error Saving the note")
        res.redirect('protected_page')
      }
      else{
        console.log("Note Saved");
        res.redirect('protected_page')
      }
    })

  })

//registering the user from the From in the index.ejs page
app.post('/register',function(req,res,next){

  var newUser = {
   firstname: req.body.firstname,
   lastname: req.body.lastname,
   email: req.body.email,
   username: req.body.username,
   password: req.body.password,
 }

 console.log("Got the user");
 addUserToDB(req,res,newUser);
  req.session.user = newUser; // Create a new session
  res.redirect('/protected_page'); 
});

function addUserToDB(req,res,newUser){
 console.log("Checking for duplicate Registration...");
 db.users.findOne({$or:[{email: newUser.email},{username: newUser.username}]},function(err,result){

       if(result){  //if the condition is met
         console.log("User Already Exits");
           //RENDER THE REGISTER PAGE SAYING THAT THE USER ALREADY EXISTS
           //yeah make an ejs a singular ejs that gives the sttus back as either a success or a user already ecists
           //remember how to do that? we folloed tha one video he sent a variable back to teh ejs page... eayh
         } else {
           console.log("Writing User to the DB");
           db.users.insert(newUser,function(err,result){
             if(err){
               console.log("Error Inserting...");
             } else {
               console.log("User Created"+ result);
                   //RENDER THE STATUS SAYING THAT THE USER HAS BEEN CREATED...
                   //res.render("registerStatus");
                 }
               })
         }
       })//
}

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    console.log("user logged out.")
  });
  res.redirect('/');
});   




//    app.post('/checkUsername',function(req,res,next){
//     enteredUsername = (req.body.enteredUsername);
//     console.log(enteredUsername);
//     db.users.findOne({username: enteredUsername},function(err,doc){
//      if(err){ 
//       res.end(JSON.stringify({
//         error: true,
//         message: 'Error checking username availability...'
//       }))
//     }
//     if(doc && doc._id){ 
//       console.log(doc.lastname+ " User aleady Exists")
//     }  else {

//      res.end(JSON.stringify({
//       error: false,
//       result: "Username Available"
//     }))
//    }
//  })
//   })
