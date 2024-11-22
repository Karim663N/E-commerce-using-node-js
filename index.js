const express = require("express");
const session = require('express-session');
const mysql = require("mysql");
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: './.env' });

const app = express();

// Middleware to set cache-control headers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    next();
});

// MySQL database connection configuration
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Connect to MySQL database
db.connect((error) => {
    if (error) {
        console.log("Error connecting to MySQL database:", error);
        return;
    }
    console.log("MySQL connected...");
});

// parse url encoded as sent by html forms
app.use(express.urlencoded({ extended: false }));
//parse JSON bodies as sent by API clients
app.use(express.json());

// Set view engine to use Handlebars
app.set('view engine', 'hbs');

// Set directory for views
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'abc.123', // Change this to a secret key for session encryption
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'))
app.use('/con', require('./routes/con'))


// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});
