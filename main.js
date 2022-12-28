require('dotenv').config();
const express = require('express');
const bodyParser = require ("body-parser");
const https = require ("https");
const mongoose = require ("mongoose");                             //using mongoose                   
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');  //build username and password with passport
var routes = require(__dirname + '/router.js');                    //connect with module router
const date = require(__dirname + '/date.js');                      //connect with module date

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

////////Use session to login/////////////////////
app.use(session({
    secret: process.env.SECRET,                             //use salt and hash this field to security
    resave: false,
    saveUninitialized: true,

}));
app.use(passport.initialize());
app.use(passport.session()); 


mongoose.connect('mongodb://localhost:27017/todoListDB');  //connect with database
mongoose.set('strictQuery',false);

const itemShema = new mongoose.Schema({                     //Create itemShema class has property: name, value: String
    name: String
})
const Item = mongoose.model('Item', itemShema);             //Create constructor 


const userShema = new mongoose.Schema({                     //Create userShema with properties:
    username: String,                                           //username - value: String
    password: String,                                           //password - value: String
    Items: [itemShema],                                         //Items    - value: itemShema
});

userShema.plugin(passportLocalMongoose);                    

const User = mongoose.model('User', userShema);

//Passport configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//module router contains GET method to login, register, logout page
app.use('/', routes);

//variable currentUser save value of current username
let currentUser ="";

//////////////////get input value when signing-up/signing-in through POST method/////////////////////
app.post('/register', function(req,res){                        
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.render('register');                             //if error, return register page
        }
        else {
            passport.authenticate('local')(req,res,function(){
                res.redirect('/login');                         //if success, go to login page
            })
        }
    })
});
app.post('/login', function(req,res){                        
    currentUser = req.body.username;
    const user = new User({                                  //create an instance of User class
        username: req.body.username,
        password: req.body.password,

    });
    req.login(user, function(err){                          //login method authenticate user with sign-up information   
        if (err) {
            console.log(err);
        }
        else {
            //if authenticated, go to home page. Or else return login page
            passport.authenticate('local',{ failureRedirect: '/login' })(req,res,function(){
                res.redirect('/');
            })           
        }
    })

});


let day = date.date();                                         //module date.js show current day

//////////////////////add, edit, delete items at home page////////////////////////////

app.get("/", function(req,res){                               //GET method to home page
    if(req.isAuthenticated()) {                               //if authenticated
        //Find username field, return an instance has username is value of currentUser
        User.findOne({username: currentUser}, function(err, showItem){ 
            if (err) console.log(err);
            else{
                res.render('home', {currentday: day, items: showItem.Items});   //show all Items
            }
        })
    }
    else res.redirect('/login');                                 //if not authenticated, return login page
})

//add items
app.post("/", function(req,res){                        
    const note = req.body.newitem;                                      //get value in input tag having name: newitem
    const item = new Item({                                             //create new item
        name: note
    });
    User.findOne({username: currentUser}, function(err, foundItem){     //accces to current user
        if (err) console.log(err);
        else {
            foundItem.Items.push(item);                                //push item into Items arrat                      
            foundItem.save(function(err){
            if(!err) res.redirect('/');
        });
    }  
    });
});

//edit items
app.post('/update', function(req,res) {                    
    const update_id = req.body.updateItem;                 //get value item having name: updateItem
    const updateContent = req.body.updatecontent;          //get content after updating
    //access to current user and update its content
    User.findOneAndUpdate({ username: currentUser, "Items._id": update_id }, {'$set': {'Items.$.name' :updateContent}}, function(err){
        if(err) console.log(err);
        else {
            res.redirect('/');                             //return to home page
        }
    });
                
});

//delete items
app.post('/delete', function(req,res) {
    const checkbox_id = req.body.checkbox;                  //get value item having name: checkbox     
    //access to current user and pull the item has id: checkbox_id out of Items array
    User.findOneAndUpdate({username: currentUser}, {$pull: {Items: {_id:checkbox_id}}}, function(err){
        if(err) console.log(err);
        else {
        res.redirect('/');                                  //return to home page
        }
        });
            
    });


app.listen(process.env.PORT || 3000, function(){
    console.log("server is running on port 3000");
});






