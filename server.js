const express = require('express');
const cluster = require('cluster');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config.json');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require(config.docs.docsPathJson);
swaggerDocument.host = `${config.general.apiUrl}:${config.network.port}`; //Make swagger host dynamic

const adminRoute = require('./api/routes/adminRoutes');
const appsRoute = require('./api/routes/appsRoutes');
const usersRoute = require('./api/routes/usersRoutes');
const statsRoute = require('./api/routes/statsRoutes');
const todosRoute = require('./api/routes/todosRoutes');

let app;
if(cluster.isMaster) {
    let numWorkers
    if(config.performance.workers == 0)
        numWorkers = require('os').cpus().length;
    else
        numWorkers = config.performance.workers;

    console.log(`Master cluster setting up ${numWorkers} workers...`);

    for(let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', worker => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
        console.log('Starting a new worker');
        cluster.fork();
    });

}else {

    app = express();
    mongoose.Promise = global.Promise;
    mongoose.connect(config.db.connectionString);

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser());

// Headers for cross-origin access
    app.use((req, res, next) => {
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


    /*const secureServer = https.createServer({
        key: fs.readFileSync(config.network.sslKey),
        cert: fs.readFileSync(config.network.sslCert)
    }, app)
        .listen(config.network.securePort, () => {
            console.log(`Secure DeployHandler API listening on port ${config.network.securePort}`);
        });*/


    const port = config.network.port;
    app.listen(port, () => {
        console.log(`Unsecure DeployHandler API listening on port ${config.network.port}`)
    });


    app.use((req, res) => {
        res.status(404).send({url: `${req.originalUrl} not found`})
    });

}
module.exports = app;