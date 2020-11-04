var express = require("express");
var app = express();
var  bodyparser = require("body-parser");
var mongoose =require("mongoose");
var passport =require("passport");
const nodemailer = require('nodemailer');
var passportLocalMongoose = require("passport-local-mongoose");

var methodOverride = require("method-override");
  

var LocalStrategy =require("passport-local");


mongoose.connect("mongodb+srv://Vidvat:H3q7a5hYxEXfA3jj@cluster0.p7iny.mongodb.net/<dbname>?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false} ).then(()=>{
    console.log("Connected to DB successfully")
})
// app.use(flash());
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));


//SCHEMA SETUP
var schooldetailsSchema = new mongoose.Schema({
	name: String,
    image: String,
    address: String,
    subject:String,
    email:String,
    contact:String,
    briefInfo:String,
    moreInfo:String,
    author: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        username: String
     },
});
var Schooldetails= mongoose.model("schooldetails",schooldetailsSchema);
//usershema
var userSchema = new mongoose.Schema({
	username: String,
    password: String,
    emailid:String,
});
userSchema.plugin(passportLocalMongoose);
var User= mongoose.model("User",userSchema);

//passport configuration
app.use(require("express-session")({
	secret: "hhhhhh",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
 });

 const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: 'filiberto51@ethereal.email',
        pass: 'ksAFW9u1696wPrSX8s'
    }
});


app.get("/",function(req,res){
	res.render("landing");
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
//School Route
 
app.get("/schooldetails",function(req,res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all school from DB
        Schooldetails.find({name: regex}, function(err, allschools){
           if(err){
               console.log(err);
           } else {
              if(allschools.length < 1) {
                  noMatch = "No school match that query, please try again.";
              }
              res.render("schooldetails",{schools:allschools, currentUser: req.user, noMatch: noMatch});
           }
        });
    } else {
        // Get all school from DB
        Schooldetails.find({}, function(err, allschools){
           if(err){
               console.log(err);
           } else {
              res.render("schooldetails",{schools:allschools, currentUser: req.user, noMatch: noMatch});
           }
        });
    }
});
 
//Create School

app.post("/schooldetails",isLoggedIn,function(req,res){
	var name=req.body.name;//Taking name from form
    var image=req.body.image;//taking image from form
    var address=req.body.address;
    var subject = req.body.subject;
    var email = req.body.email;
    var contact = req.body.contact;
    var briefInfo = req.body.briefInfo;
    var moreInfo = req.body.moreInfo;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
	var newdetails={name:name,image:image,address:address,subject:subject,email:email,contact:contact,author:author,briefInfo:briefInfo,moreInfo:moreInfo}
	//Create a new campground and save to DB
	Schooldetails.create(newdetails, function(err,newlycreated){
		if(err){
			console.log(err);
		}else{
			res.redirect("/schooldetails");//redirect back
		}
	})
	
});
//Delete School
app.get('/schooldetail/:id',checkSchoolOwnership,  async function (req, res) {
    await Schooldetails.findOneAndDelete(
        { _id: req.params.id }
    ).then(function () {
        res.redirect("/schooldetails")
    }).catch(err => {
        console.log("Error Occured while deleting  : " + err);
    });
});
// EDIT School
app.get('/schooldetails/:id/edit',checkSchoolOwnership, function (req, res) {
    Schooldetails.findOne({ _id: req.params.id }, function (err, foundschool) {
        if (err) {
            console.log(err);
            res.redirect('/schooldetails/:id');
        } else {
            res.render('school_edit', { school: foundschool });
        }
    });
});

//  edit logic
app.post('/schooldetails/:id/edit', checkSchoolOwnership,function (req, res) {


    Schooldetails.findOneAndUpdate({ _id: req.params.id }, req.body.school, function (err, updatedschool) {
        if (err) {
            console.log(err);
            res.redirect('/schooldetails');
        } else {
            res.redirect('/schooldetails');
        }
    });
});
//Render The form
app.get("/schooldetails/new",isLoggedIn,function(req,res){
		res.render("new.ejs");
        });
//Sign in page rendering        
app.get("/registerschool",function(req,res){
	res.render("registerschool");
});
//handle signup logic
app.post("/registerschool", function(req, res){

    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("registerschool");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/schooldetails"); 
        });
    });
});
app.post('/apply/:emailid',function(req,res){


let mailOptions = {
    from: '"VidVat" abhijeetmaniyawan@gmail.com',
    to: `${req.params.emailid}`,
    subject: "Vidvat- Application",
    html: output
};
transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
        console.log("Couldn't send email: " + err.message);
    }
           });
        });



app.get("/loginschool", function(req, res){
   res.render("loginschool"); 
});
// handling login logic
app.post("/loginschool", passport.authenticate("local", 
    {
        successRedirect: "/schooldetails",
        failureRedirect: "/loginschool"
    }), function(req, res){
});
//logout
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});
//Is LoggedIn
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/loginschool");
}
// SHOW - shows more info about one campground
app.get("/schooldetails/:id", function(req, res){
    //find the campground with provided ID
    Schooldetails.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("show", {schooling: foundCampground});
        }
    });
})


// CheckOwnership
function checkSchoolOwnership(req, res, next) {
    if(req.isAuthenticated()){
           Schooldetails.findById(req.params.id, function(err, foundschool){
              if(err){
                  res.redirect("back");
              }  else {
                  
               if(foundschool.author.id.equals(req.user._id)) {
                   next();
               } else {
                   res.redirect("back");
               }
              }
           });
       } else {
           res.redirect("back");
       }
   }


app.listen(3000,() => {
	console.log("server is listening");
});