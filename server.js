var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var appsRoute = require('./api/routes/appsRoutes');
var usersRoute = require('./api/routes/usersRoutes');

var app = express();
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/deployhandlerapi');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Headers for cross-origin access
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); //Will change to actual Internal network IP
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    next();
});

app.use('/api/apps', appsRoute);
app.use('/api/users', usersRoute);

var port = process.env.PORT || 3000;
app.listen(port);

app.get('/', function(req, res) {
    res.send('Hi there, welcome! The DeployHandler API is at http://deployhandler.com:' + port + '/api');
});

console.log('DeployHandler API server up on : ' + port);

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

module.exports = app;