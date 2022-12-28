var express = require('express');
var router = express.Router();

//   
router.get('/register', function(req,res){
    res.render('register');
})

router.get('/login', function(req,res){
    res.render('login');
})
    
router.get('/logout', function(req,res){
    req.logout(function(err) {
        if (err) { console.log(err); }
        else{
            res.redirect('/login');
        }
})
})
    
    
module.exports = router;