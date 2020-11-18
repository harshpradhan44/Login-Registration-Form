const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = 3000;
var router = express.Router();
var userModule = require('./models/user');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var session = require('express-session');
const { findById } = require('./models/user');
var CreateProfileModule = require('./models/create_profile');

var fs = require('fs'); 
var path = require('path'); 
var multer = require('multer'); 

var storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'uploads') 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname + '-' + Date.now()) 
    } 
}); 

var upload = multer({ storage: storage }); 
  
app.use(session({
	secret: 'qd_pb3n!9*',
	resave: false,
	saveUninitialized: true,
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function checkLoginUser(req, res, next) {
	var userToken = localStorage.getItem('userToken');	
	try {
		if(req.session.username) {
			var decoded = jwt.verify(userToken, 'loginToken');
		} else {
			res.render('index', { title: 'Form Data', msg:'' });
		}
	}
	catch (err) {
		res.render('index', { title: 'Form Data', msg:'' });
	}
	next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
  }
  

function checkEmail(req, res, next) {
	var email = req.body.email;
	var checkExistEmail = userModule.findOne({email:email});
	checkExistEmail.exec((err, data) => {
		if(err) throw err;
		if(data) {
			return res.render('signup', { title: 'Form Data', msg:'Email Already exist' });
		}
		next();
	});
}

function checkUserName(req, res, next) {
	var username = req.body.uname;
	var checkUserName = userModule.findOne({username:username});
	checkUserName.exec((err, data) => {
		if(err) throw err;
		if(data) {
			return res.render('signup', { title: 'Form Data', msg:'user name Already exist' });
		}
		next();
	});
}

app.get('/dashboard', checkLoginUser, function(req, res, next) {
    var loginUser = req.session.username;
    res.render('dashboard', { title: 'Form data', msg:'', loginUser:loginUser });
});


app.get('/', function(req, res, next) {
res.render('index', { title: 'Form Data', msg:'' });
});

app.post('/', function(req, res, next) {
  var username = req.body.uname;
  var password = req.body.password;
  // console.log(password);
  var checkUser = userModule.findOne({username:username});
  checkUser.exec((err, data) => {
      if(err) {
          console.log(err);
         // throw err;
          res.render('index', { title: 'Form data', msg:'Invalid Login Details' });
      }
      if(data)
      {
      var getUserID = data._id;
        var getPassword = data.password;
        if(bcrypt.compareSync(password, getPassword))
        {
            var token = jwt.sign({userID: getUserID}, 'loginToken');
            console.log(username)
            localStorage.setItem('userToken', token);
            localStorage.setItem('loginUser', username);
            console.log(username)
            req.session.username = username;
            
            res.redirect('/dashboard');
        }
        else {
            res.render('index', { title: 'Form Data', msg:'Invalid username and password' });
        }
    }
    else
        res.render('index', { title: 'Form Data', msg:'Invalid Login Details' });
  });

});

app.get('/signup', function(req, res, next) {
    console.log("HERE")
    res.render('signup', { title: 'Form Data', msg:'' });
});

app.post('/signup', checkEmail,checkUserName, function(req, res, next) {
  var username = req.body.uname;
  var email = req.body.email;
  var password = req.body.password;
  var confirmpassword = req.body.confpassword;
  console.log(username);
  if(password != confirmpassword) {
      res.render('signup', { title: 'Form Data', msg:'password not matched!' });
  }
  else {
      password = bcrypt.hashSync(password, 10);
      var userDetails = new userModule({
          username: username,
          email: email,
          password: password
      });

      userDetails.save((err, doc) => {
          if(err) throw err;
          console.log(err);
          res.render('signup', { title: 'Form Data', msg:'User Registered Successfully!' });
      })
  }
});

app.get('/forgotPassword', function(req, res, next) {
    console.log("HERE")
    res.render('forgotPassword', { title: 'FORM', msg:'' });
});

app.post('/forgotPassword',(req,res,next)=>{
    var username = req.body.uname;
    var password = req.body.password;
    var checkUserName = userModule.findOne({username:username});
	checkUserName.exec((err, data) => {
        if(err) throw err;
		if(data) {
            password = bcrypt.hashSync(password, 10);
            userModule.findByIdAndUpdate(data._id,{
                password: password
            }).exec(err,data=>{
                if(err) throw err;
			//res.redirect('/view-ticket');
             res.render('index', { title: 'Form Data', msg:'Password Updated Succesfully!' });
            })
			
		}
        else
         return res.render('forgotPassword', { title: 'FORM', msg:'UserName not Found' })
	});
})

app.get('/create-profile', checkLoginUser, function(req, res, next) {
	var loginUser = req.session.username;
	res.render('create_profile', { title: 'Form Data', msg:'', loginUser:loginUser });
});


app.post('/create-profile', checkLoginUser, upload.single('profilePicture'),async function(req, res, next) {
    //var username = 
    var loginUser = req.session.username
    console.log(req.file.filename)
    var obj = { 
        User: loginUser,
        Name: req.body.name, 
        Age: req.body.age,
        Gender: req.body.gender, 
        img: { 
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
            contentType: 'image/png'
        } 
    } 

    CreateProfileModule.create(obj, (err, item) => { 
        if (err) { 
            console.log(err); 
        } 
        else { 
            // item.save();        
            res.render('create_profile', { title: 'Form Data', msg:'Profile created successfully', loginUser:loginUser });
        } 
    }).catch(err=>console.log(err)); 

});

app.get('/view-profile', (req, res) => { 
    var loginUser = req.session.username
    var profile = CreateProfileModule.findOne({User:loginUser})
    profile.exec((err, data) => { 
        if (err) { 
            console.log(err); 
        } 
        else if(data){ 
            console.log(data.Name)
            res.render('view_profile', { title: 'Form Data', msg:'', loginUser:loginUser, records:data}); 
        } 
    }); 
}); 

app.get('/logout', function(req, res, next) {
	req.session.destroy(function(err) {
		if(err) {
			res.redirect('/');
		}
	});
	res.redirect('/');
});


app.listen(PORT,()=>console.log(`Server Listening At PORT: ${PORT}`))