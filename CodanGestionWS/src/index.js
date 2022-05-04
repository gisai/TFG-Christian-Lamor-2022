var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var methodOverride = require('method-override');
var session = require('express-session');
var flash = require('express-flash');
var db = require('./database');

// Initializations
var app = express();

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'c0d4n;',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.use(flash());

// Global Variables


// Routes
app.use(require('./routes/index'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Server init
app.listen(app.get('port'), () => {
    console.log('Server on port ', app.get('port'));
});

module.exports = app;