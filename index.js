const express = require('express');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const routes = require('./routes/routes');
const http = require("http");
const ejs = require('ejs');
const socket = require("socket.io");
const socketController = require('./controllers/socketController');
const sharedsession = require('express-socket.io-session');
const favicon = require('serve-favicon'); // Import serve-favicon

const secretKey = crypto.randomBytes(64).toString('hex');

const app = express();
const server = http.createServer(app);
const io = socket(server);

socketController(io);

const port = 3000;

const sessionMiddleware = session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
});

// Use session middleware with Express
app.use(sessionMiddleware);

io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));

// Display static files (e.g. HTML, CSS)
app.use(express.static('public'));
app.use(express.static('views'));

// Use the favicon middleware
app.use(favicon(path.join(__dirname, 'public', 'images', 'app', 'favicon.ico')));

// Specify that files with .html extension will be processed by EJS
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Middleware for processing POST requests in JSON format
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the routes
app.use('/', routes);

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});