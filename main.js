require('dotenv').config();
const express = require('express');
const bodyParser = require ("body-parser");
const https = require ("https");
const mongoose = require ("mongoose");                             //kết nối database                    
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');  //plugin để build username và password với passport
var routes = require(__dirname + '/router.js');               //kết nối với module router
const date = require(__dirname + '/date.js');                      //kết nối với module date

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

////////Kết nối và sử dụng session để login/////////////////////
app.use(session({
    secret: process.env.SECRET,                             //bảo mật bằng salt và hash dãy secret này
    resave: false,
    saveUninitialized: true,

}));
app.use(passport.initialize());
app.use(passport.session()); 


mongoose.connect('mongodb://localhost:27017/todoListDB');  //Kết nối database
mongoose.set('strictQuery',false);

const itemShema = new mongoose.Schema({                     //Tạo lớp itemShema có thuộc tính name với giá trị kiểu String
    name: String
})
const Item = mongoose.model('Item', itemShema);             //Khởi tạo constructor 


const userShema = new mongoose.Schema({                     //Tạo lớp userShema với các thuộc tính:
    username: String,                                           //username - giá trị kiểu String
    password: String,                                           //password - giá trị kiểu String
    Items: [itemShema],                                         //Items    - giá trị kiểu itemShema
});

userShema.plugin(passportLocalMongoose);                    

const User = mongoose.model('User', userShema);

//Cấu hình Passport
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//module router chứa các phương thức get() đến trang login, register, logout
app.use('/', routes);

//Biến currentUser lưu giá trị tên username hiện tại
let currentUser ="";

//////////////////Lấy giá trị input khi đăng nhập và đăng ký thông qua method POST/////////////////////
app.post('/register', function(req,res){                        //method POST lấy request từ trang đăng ký
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.render('register');                             //Nếu có lỗi, quay lại trang đăng ký
        }
        else {
            passport.authenticate('local')(req,res,function(){
                res.redirect('/login');                         //Nếu đăng ký thành công, đến trang login
            })
        }
    })
});
app.post('/login', function(req,res){                        //method POST lấy request từ trang đăng nhập
    currentUser = req.body.username;
    const user = new User({                                  //Tạo 1 instance của lớp User
        username: req.body.username,
        password: req.body.password,

    });
    req.login(user, function(err){                          //Phương thức login xác thực user với thông tin đã register trước đó    
        if (err) {
            console.log(err);
        }
        else {
            //Đăng nhập thành công, đến trang todolist. Nếu không quay lại trang login
            passport.authenticate('local',{ failureRedirect: '/login' })(req,res,function(){
                res.redirect('/');
            })          
        }
    })

});


let day = date.date();                                         //Gọi module date.js hiển thị ngày hôm nay

//////////////////////Thêm, sửa, xóa item ghi chú tại home page////////////////////////////

app.get("/", function(req,res){                               //Method get() truy cập đến trang chủ todolist
    if(req.isAuthenticated()) {                               //nếu login đã được xác thực
        //Tìm trong database theo trường username, trả về kết quả là instance  có username là currentUser
        User.findOne({username: currentUser}, function(err, showItem){ 
            if (err) console.log(err);
            else{
                res.render('home', {currentday: day, items: showItem.Items});   //Hiển thị thông tin trường Items
            }
        })
    }
    else res.redirect('/login');                                 //Nếu xác thực không thành công, quay lại trang login
})

//Thêm item ghi chú
app.post("/", function(req,res){                        
    const note = req.body.newitem;                                      //Lấy giá trị input tại ô nhập giá trị 
    const item = new Item({                                            //Tạo ghi chú mới là 1 thể hiện của lớp Item
        name: note
    });
    User.findOne({username: currentUser}, function(err, foundItem){     //Truy cập đến username hiện tại
        if (err) console.log(err);
        else {
            foundItem.Items.push(item);                                //Thêm ghi chú đó vào array Items                       
            foundItem.save(function(err){
            if(!err) res.redirect('/');
        });
    }  
    });
});

//Sửa item ghi chú
app.post('/update', function(req,res) {                    
    const update_id = req.body.updateItem;                 //Lấy giá trị id của item cần sửa khi tích vào ô sửa   
    const updateContent = req.body.updatecontent;          //Lấy giá trị nội dung cần update
    //Truy cập đến username hiện tại và sửa nội dung của item đó thành updateContent
    User.findOneAndUpdate({ username: currentUser, "Items._id": update_id }, {'$set': {'Items.$.name' :updateContent}}, function(err){
        if(err) console.log(err);
        else {
            res.redirect('/');                             //Quay lại trang todolist
        }
    });
                
});

//Xóa item ghi chú
app.post('/delete', function(req,res) {
    const checkbox_id = req.body.checkbox;                  //Lấy giá trị id của item cần xóa khi tích vào checkbox      
    //Truy cập đến username hiện tại và lấy phần tử có id: checkbox_id ra khỏi array Items
    User.findOneAndUpdate({username: currentUser}, {$pull: {Items: {_id:checkbox_id}}}, function(err){
        if(err) console.log(err);
        else {
        res.redirect('/');                                  //Quay lại trang todolist
        }
        });
            
    });


app.listen(process.env.PORT || 3000, function(){
    console.log("server is running on port 3000");
});






