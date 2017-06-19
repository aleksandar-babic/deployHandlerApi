'use strict';
var mongoose = require('mongoose');
var sys = require('util');
var exec = require('child_process').exec;
var jwt = require('jsonwebtoken');
var portscanner = require('portscanner');
var sleep = require('sleep');

var App = require('../models/appsModel');
var User = require('../models/usersModel');

//Helper function to count number of  occurrences of specific character
function count(s1, letter) {
    return ( s1.match( RegExp(letter,'g') ) || [] ).length;
}

exports.getAppList = function(req, res) {
    var decoded = jwt.decode(req.query.token);
    App.find({'user': decoded.user._id}, function(err, app) {
        if (err)
            return res.status(500).send(err);
        return res.status(200).json(app);
    });
};

exports.addApp = function(req, res) {
        var decoded = jwt.decode(req.query.token);
        if(!req.body.name || !req.body.port || !req.body.entryPoint)
            return res.status(500).json({
                message: 'App name, port and entry point are required.'
            });
        if(req.body.name.toLowerCase() == 'api')
            return res.status(500).json({
                message: 'api subdomain name is reserved for internal use.'
            });
        if(req.body.port == '80' || req.body.port == '443')
            return res.status(500).json({
                message: 'Ports 80 and 443 are reserved for internal use.'
            });
        if(count(req.body.entryPoint,'\\.') > 1)
            return res.status(500).json({
                message: 'Entry point is not valid. Example: server.js'
            });
        User.findById(decoded.user._id,function (err,user) {
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
            App.findOne({name:req.body.name},function (err,app) {
                if(err)
                    return res.status(500).json({
                        message: 'An error occurred',
                        error: err
                    });
                if(app)
                    return res.status(500).json({
                        message: 'App with that name already exists. Take another name.'
                    });

                App.findOne({port:req.body.port},function (err,app) {
                    if (err)
                        return res.status(500).json({
                            message: 'An error occurred',
                            error: err
                        });
                    if (app)
                        return res.status(500).json({
                            message: 'App with that port already exists. Use another port.'
                        });

                    var sendCommand = exec("bash /root/scripts/addApp.sh " + decoded.user.username +' '+ req.body.name +' '+ req.body.port, function(err, stdout, stderr) {
                        console.log("STDOUT: "+stdout);
                        console.log("STDERR: "+stderr);
                    });
                    sendCommand.on('exit', function (code) {
                        if (code != 0){
                            return res.status(500).json({
                                message: 'An error occurred while adding app.',
                                error: err
                            });
                        }
                        else{
                            var app = new App({
                                name:req.body.name,
                                entryPoint:req.body.entryPoint,
                                port:req.body.port,
                                user:user
                            });

                            app.save(function (err,result) {
                                if(err)
                                    return res.status(500).json({
                                        message: 'An error occurred',
                                        error: err
                                    });

                                user.apps.push(result);
                                user.save();
                                res.status(201).json({
                                    message: 'App added successfully.',
                                    obj: result
                                });
                            });
                        }
                    });
                });
            });
        });
};

exports.viewApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        return res.status(200).json(app);
    });
};

exports.updateApp = function(req, res) {

    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        App.findOneAndUpdate({'_id':req.params.appId}, req.body, {new: true}, function(err, app){
            if (err)
                return res.status(500).send(err);
            if (!app)
                return res.status(404).json({ message: 'Could not find app with that id.' });

            //TODO allow port or app name to be changed (Must write new util script)
            return res.status(200).json(app);
        });
    });

};

exports.deleteApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        var sendCommand = exec("bash /root/scripts/removeApp.sh " + decoded.user.username +' '+ app.name, function(err, stdout, stderr) {
            console.log(stdout);
        });
        sendCommand.on('exit', function (code) {
            if (code != 0)
                return res.status(500).json({ message: 'Error while deleting app.' });
            else{
                app.remove(function (err,result) {
                    if (err)
                        return res.status(500).send(err);
                    return res.status(200).json({ message: 'App has been deleted.' });
                });
            }
        });
    });
};

exports.startApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        var sendCommand = exec("bash /root/scripts/startApp.sh " + decoded.user.username + ' ' + app.name + ' ' + app.entryPoint, function(err, stdout, stderr) {
            console.log(stdout);
        });
        sendCommand.on('exit', function (code) {
            if (code == 2)
                return res.status(500).json({ message: 'App is already started.' });
            else if(code == 1)
                return res.status(500).json({ message: 'App start FAILED.' });
            else{
                sleep.sleep(1); //Sleep for 1 seconds just in case, make sure that pm2 has actually started app
                portscanner.checkPortStatus(app.port, '127.0.0.1', function(error, status) {
                    if(status=='open') {
                        app.status = "started";
                        app.save();
                        return res.status(200).json({
                            message: 'App has been started.',
                            obj:app
                        });
                    }
                    else {
                        return res.status(500).json({ message: 'App start FAILED.' });
                    }
                });
            }
        });
    });
};

exports.stopApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var decoded = jwt.decode(req.query.token);
        if(decoded.user._id != app.user)
            return res.status(401).json({ message: 'That app does not belong to you.'});

        var sendCommand = exec("bash /root/scripts/stopApp.sh " + app.name , function(err, stdout, stderr) {
            console.log(stdout);
        });

        sendCommand.on('exit', function (code) {
            if(code == 1)
                return res.status(500).json({ message: 'App is already stopped' });
            else{
                portscanner.checkPortStatus(app.port, '127.0.0.1', function(error, status) {
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
