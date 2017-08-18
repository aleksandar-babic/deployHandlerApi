var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const config = require('./config.json');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require(config.docs.docsPathJson);

var adminRoute = require('./api/routes/adminRoutes');
var appsRoute = require('./api/routes/appsRoutes');
var usersRoute = require('./api/routes/usersRoutes');
var statsRoute = require('./api/routes/statsRoutes');
var todosRoute = require('./api/routes/todosRoutes');

var app = express();
mongoose.Promise = global.Promise;
mongoose.connect(config.db.connectionString);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Headers for cross-origin access
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', config.security.headerAllowOrigin); //Will change to actual Internal network IP
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, PUT, DELETE, OPTIONS');
    next();
});

app.use('/api/admin', adminRoute);
app.use('/api/apps', appsRoute);
app.use('/api/users', usersRoute);
app.use('/api/stats', statsRoute);
app.use('/api/todos', todosRoute);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

var port = config.network.port;
app.listen(port);


console.log('DeployHandler API server up on : ' + port);

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

module.exports = app;