var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');

// Connect to the database
mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Initialize the Express app
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

//set global errors variable
app.locals.errors = null;

<<<<<<< HEAD
=======
// Get Page Model
var Page = require('./models/page');

// Get all pages to pass to header.ejs
Page.find({}).sort({ sorting: 1 }).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});
>>>>>>> 02be140b833a3d56981644349bde8fc8e7d53a22

//Express fileUpload middleware
app.use(fileUpload());

//body-parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
//express session
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

// Express Validator middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {

            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));




// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});


// set route
var pages = require('./routes/pages');
var adminPages = require('./routes/admin_pages');
var adminCategories = require('./routes/admin_categories');
var adminProducts = require('./routes/admin_products.js');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/', pages);

// Start the server
var port = 3000;
app.listen(port, function () {
    console.log('Server is started on port ' + port);
});