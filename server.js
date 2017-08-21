var express = require('express');
var cluster = require('cluster');
var https = require('https');
var fs = require('fs');
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


if(cluster.isMaster) {
    if(config.performance.workers == 0)
        var numWorkers = require('os').cpus().length;
    else
        var numWorkers = config.performance.workers;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for(var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });

}else {

    var app = express();
    mongoose.Promise = global.Promise;
    mongoose.connect(config.db.connectionString);

    app.use(bodyParser.urlencoded({extended: true}));
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


    var secureServer = https.createServer({
        key: fs.readFileSync(config.network.sslKey),
        cert: fs.readFileSync(config.network.sslCert)
    }, app)
        .listen(config.network.securePort, function () {
            console.log('Secure DeployHandler API listening on port ' + config.network.securePort);
        });


    var port = config.network.port;
    app.listen(port, function () {
        console.log('Unsecure DeployHandler API listening on port ' + config.network.port)
    });


    app.use(function (req, res) {
        res.status(404).send({url: req.originalUrl + ' not found'})
    });

}
module.exports = app;