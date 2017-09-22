'use strict';
const mongoose = require('mongoose');
const sys = require('util');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const jwt = require('jsonwebtoken');
const portscanner = require('portscanner');
const sleep = require('sleep');
const replace = require('replace-in-file');

const config = require('../../config.json');

const App = require('../models/appsModel');
const User = require('../models/usersModel');

//Helper function to count number of  occurrences of specific character
function count(s1, letter) {
    return ( s1.match( RegExp(letter,'g') ) || [] ).length;
}

exports.getAppList = (req, res) => {
    const decoded = jwt.decode(req.query.token);
    App.find({'user': decoded.user._id}, (err, app) => {
        if (err)
            return res.status(500).send(err);
        return res.status(200).json(app);
    });
};


exports.addApp = (req, res) => {
        const decoded = jwt.decode(req.query.token);
        if(!req.body.name || !req.body.port || !req.body.entryPoint)
            return res.status(500).json({
                message: 'App name, port and entry point are required.'
            });
        if(!(/^\d+$/.test(req.body.port)))
            return res.status(500).json({
                message: 'Port can only contain digits.'
            });
        if(/\s/.test(req.body.name))
            return res.status(500).json({
                message: 'App name cannot contain space.'
            });
        if(! /^[a-z1-9-]+$/.test(req.body.name))
            return res.status(500).json({
                message: 'App name can contain only characters,numbers and dash.'
            });
        if(req.body.name.toLowerCase() == 'api'  || req.body.name.toLowerCase() == 'sftp'
            || req.body.name.toLowerCase() == 'www' || req.body.name.toLowerCase() == 'mail'
            || req.body.name.toLowerCase() == 'ftp' || req.body.name.toLowerCase() == 'app')
            return res.status(500).json({
                message: `${req.body.name.toLowerCase()} subdomain name is reserved for internal use.`
            });
        if(parseInt(req.body.port) < 1024 || parseInt(req.body.port) > 49150)
            return res.status(500).json({
                message: 'Apps can only use port range of 1024-49150.'
            });
        if(req.body.port && (req.body.port == '80' || req.body.port == '443'))
            return res.status(500).json({
                message: 'Ports 80 and 443 are reserved for internal use.'
            });
        if(req.body.port && (req.body.port == '8080' || req.body.port == '8443'))
            return res.status(500).json({
                message: 'Ports 8080 and 8443 are reserved for internal use.'
            });

        if((count(req.body.entryPoint,'\\.') > 1 || new RegExp('\\s').test(req.body.entryPoint)) &&
            (!(req.body.isNpm == 'true') || !req.body.isNpm))
            return res.status(500).json({
                message: 'Entry point is not valid. Example: server.js'
            });

        if((count(req.body.entryPoint,'\\.') > 1) && ((req.body.isNpm == 'true') && req.body.isNpm))
            return res.status(500).json({
                message: 'NPM command as entry point is not valid. Example: start'
            });

        User.findById(decoded.user._id,(err, user) => {
            if(err)
                return res.status(500).json({
                    message: 'An error occurred',
                    error: err
                });
            if(!user)
                return res.status(404).json({
                    message: 'Could not find that user',
                    error: err
                });
            App.findOne({name:req.body.name},(err, app) => {
                if(err)
                    return res.status(500).json({
                        message: 'An error occurred',
                        error: err
                    });
                if(app)
                    return res.status(500).json({
                        message: 'App with that name already exists. Take another name.'
                    });

                App.findOne({port:req.body.port},(err, app) => {
                    if (err)
                        return res.status(500).json({
                            message: 'An error occurred',
                            error: err
                        });
                    if (app)
                        return res.status(500).json({
                            message: 'App with that port already exists. Use another port.'
                        });

                    const sendCommand = exec(`bash ${config.general.workingDir}util/addApp.sh ${decoded.user.username} ${req.body.name} ${req.body.port}`, (err, stdout, stderr) => {
                        console.log(`STDOUT: ${stdout}`);
                        console.log(`STDERR: ${stderr}`);
                    });

                    sendCommand.on('exit', code => {
                        if (code != 0){
                            return res.status(500).json({
                                message: 'An error occurred while adding app.',
                                error: err
                            });
                        }
                        else{
                            if((req.body.isNpm === 'true') && req.body.isNpm) {
                                let app = new App({
                                    name: req.body.name.toLowerCase(),
                                    entryPoint: `npm.${req.body.entryPoint}`,
                                    port: req.body.port,
                                    user: user
                                });
                            }else {
                                let app = new App({
                                    name: req.body.name.toLowerCase(),
                                    entryPoint: req.body.entryPoint,
                                    port: req.body.port,
                                    user: user
                                });
                            }
                            app.save((err, result) => {
                                if(err)
                                    return res.status(500).json({
                                        message: 'An error occurred',
                                        error: err
                                    });

                                user.apps.push(result);
                                user.save();
                                res.status(201).json({
                                    message: 'App added successfully.',
                                    obj: app
                                });
                            });
                        }
                    });
                });
            });
        });
};

exports.viewApp = (req, res) => {
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        const decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        return res.status(200).json(app);
    });
};

exports.updateApp = (req, res) => {

    if(!req.body.name && !req.body.port && !req.body.entryPoint)
        return res.status(500).json({
            message: 'Request has to contain atleast one of following : name, entryPoint, port.',
        });
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        let decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        if(app.status == 'started')
            return res.status(500).json({
                message: 'App must be stopped before it can be modified.'
            });
        if(req.body.port && !(/^\d+$/.test(req.body.port)))
            return res.status(500).json({
                message: 'Port can only contain digits.'
            });
        if(req.body.name && /\s/.test(req.body.name))
            return res.status(500).json({
                message: 'App name cannot contain space.'
            });

        if(req.body.name && ( req.body.name.toLowerCase() == 'api'  || req.body.name.toLowerCase() == 'sftp'
            || req.body.name.toLowerCase() == 'www' || req.body.name.toLowerCase() == 'mail'
            || req.body.name.toLowerCase() == 'ftp' || req.body.name.toLowerCase() == 'app' ))
            return res.status(500).json({
                message: `${req.body.name.toLowerCase()} subdomain name is reserved for internal use.`
            });
        if(req.body.port && (req.body.port == '80' || req.body.port == '443'))
            return res.status(500).json({
                message: 'Ports 80 and 443 are reserved for internal use.'
            });
        if(req.body.port && (req.body.port == '8080' || req.body.port == '8443'))
            return res.status(500).json({
                message: 'Ports 8080 and 8443 are reserved for internal use.'
            });
        if(req.body.entryPoint && (count(req.body.entryPoint,'\\.') > 1))
            return res.status(500).json({
                message: 'Entry point is not valid. Example: server.js'
            });
        if(req.body.name && req.body.name != app.name) {
            const options = {
                files: `/etc/nginx/sites-available/${app.name}.deployhandler.com`,
                from: app.name,
                to: req.body.name
            };
            try {
                let changedFile = replace.sync(options);
                console.log(`Changed file: ${changedFile}`);
                let decoded = jwt.decode(req.query.token);
                execSync(`bash ${config.general.workingDir}util/renameApp.sh ${app.name} ${req.body.name} ${decoded.user.username}`);
                app.name = req.body.name;
            }
            catch (e) {
                return res.status(500).json({ message: 'Error while updating app, server side.' });
            }
        }
        if(req.body.entryPoint && req.body.entryPoint != app.entryPoint)
            app.entryPoint = req.body.entryPoint;
        if(req.body.port && req.body.port != app.port) {
            const options = {
                files: `/etc/nginx/sites-available/${app.name}.deployhandler.com`,
                from: app.port,
                to: req.body.port
            };
            try {
                let changedFile = replace.sync(options);
                console.log(`Changed file: ${changedFile}`);
                app.port = req.body.port;
            }
            catch (e) {
                console.error('Error occurred:', e);
            }
        }
        app.save(err => {
            if (err)
                return res.status(500).json({
                    message: 'Error while updating app.',
                    error: err
                });
            return res.status(200).json(app);
        });
    });

};

exports.deleteApp = (req, res) => {
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        const decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        const sendCommand = exec(`bash ${config.general.workingDir}util/removeApp.sh ${decoded.user.username} ${app.name}`, (err, stdout, stderr) => {
            console.log(stdout);
        });
        sendCommand.on('exit', code => {
            if (code != 0)
                return res.status(500).json({ message: 'Error while deleting app.' });
            else{
                app.remove((err, result) => {
                    if (err)
                        return res.status(500).send(err);
                    return res.status(200).json({ message: 'App has been deleted.' });
                });
            }
        });
    });
};


exports.startApp = (req, res) => {
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });

        const decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        if(app.entryPoint.includes('npm.')){
            const npmCommand = app.entryPoint.split('.');
            console.log(`Detected NPM: ${npmCommand[1]}`);
            let sendCommand = exec(`bash ${config.general.workingDir}util/startApp.sh ${decoded.user.username} ${app.name} - ${npmCommand[1]}`, (err, stdout, stderr) => {
                console.log(stdout);
            });
        } else {
            console.log('NO NPM');
            let sendCommand = exec(`bash ${config.general.workingDir}util/startApp.sh ${decoded.user.username} ${app.name} ${app.entryPoint}`, (err, stdout, stderr) => {
                console.log(stdout);
            });
        }
        sendCommand.on('exit', code => {
            if (code == 2) {
                portscanner.checkPortStatus(app.port, '127.0.0.1', (error, status) => {
                    if (status == 'open')
                        return res.status(500).json({message: 'App is already started.'});
                    else
                        return res.status(500).json({message: 'App start FAILED.'});
                });
            }
            else if(code == 1)
                return res.status(500).json({ message: 'App start FAILED.' });
            else{
                sleep.sleep(1); //Sleep for 1 seconds just in case, make sure that pm2 has actually started app
                portscanner.checkPortStatus(app.port, '127.0.0.1', (error, status) => {
                    if(status=='open') {
                        app.status = "started";
                        app.save();
                        return res.status(200).json({
                            message: 'App has been started.',
                            obj:app
                        });
                    }
                    else {
                        //Clean app remainings if app start failed
                        const sendCommand = exec(`bash ${config.general.workingDir}util/stopApp.sh ${app.name}` , (err, stdout, stderr) => {
                            console.log('Cleaning trash from app that failed to start.');
                            return res.status(500).json({ message: 'App start FAILED.' });
                        });
                    }
                });
            }
        });
    });
};

exports.stopApp = (req, res) => {
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        const decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        const sendCommand = exec(`bash ${config.general.workingDir}util/stopApp.sh ${app.name}` , (err, stdout, stderr) => {
            console.log(stdout);
        });

        sendCommand.on('exit', code => {
            if(code == 1)
                return res.status(500).json({ message: 'App is already stopped' });
            else{
                portscanner.checkPortStatus(app.port, '127.0.0.1', (error, status) => {
                    if(status=='open')
                        return res.status(500).json({ message: 'App stop FAILED.' });
                    else {
                        app.status = "stopped";
                        app.save();
                        return res.status(200).json({ message: 'App has been stopped.' });
                    }
                });
            }
        });
    });
};

exports.npmInstall = (req, res) => {
    App.findById(req.params.appId, (err, app) => {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({message: 'Could not find app with that id.'});
        const decoded = jwt.decode(req.query.token);
        if (decoded.user._id != app.user)
            return res.status(401).json({message: 'That app does not belong to you.'});

        exec(`cd /home/${decoded.user.username}/${app.name} && npm install`, (err, stdout, stderr) => {
            if (err) return res.status(500).json({message: 'Error while starting npm install.',obj: err});
            res.status(200).json({output: stdout});
        });
    });
};
