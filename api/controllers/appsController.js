'use strict';
var mongoose = require('mongoose');
var sys = require('util');
var exec = require('child_process').exec;

var App = require('../models/appsModel')

exports.getAppList = function(req, res) {
    App.find({}, function(err, app) {
        if (err)
            return res.status(500).send(err);
        res.status(200).json(app);
    });
};

exports.addApp = function(req, res) {
        var app = new App(req.body);
        app.save(function (err, app) {
            if (err)
                return res.status(500).send(err);
            var sendCommand = exec("bash /root/scripts/addApp.sh " + req.body.user + ' 1234 ' + req.body.name + ' ' + req.body.port, function(err, stdout, stderr) {
                if (err)
                    return res.status(500).json({ message: 'Error while adding app.' });
                console.log(stdout);
            });
            sendCommand.on('exit', function (code) {
                if (code != 0)
                    return res.status(500).json({ message: 'Error while adding app.' });
                else
                    return res.status(201).json(app);
            });
        });
};

exports.viewApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        res.status(200).json(app);
    });
};

exports.updateApp = function(req, res) {
    App.findOneAndUpdate({'_id':req.params.appId}, req.body, {new: true}, function(err, app){
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        return res.status(200).json(app);
    });
};


exports.deleteApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            return res.status(500).send(err);
        if (!app)
            return res.status(404).json({ message: 'Could not find app with that id.' });
        var sendCommand = exec("bash /root/scripts/removeApp.sh " + app.user +' '+ app.name, function(err, stdout, stderr) {
            if (err)
                return res.status(500).json({ message: 'Error while deleting app.' });
            console.log(stdout);
        });
        sendCommand.on('exit', function (code) {
            if (code != 0)
                return res.status(500).json({ message: 'Error while deleting app.' });
            else{
                App.remove({
                    _id: app._id
                }, function(err, app) {
                    if (err)
                        return res.status(404).send(err);
                    res.status(200).json({ message: 'App has been deleted.' });
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
        var sendCommand = exec("bash /root/scripts/startApp.sh " + app.user + ' ' + app.name + ' ' + app.entryPoint, function(err, stdout, stderr) {
            if (err)
                return res.status(500).json({ message: 'Error while starting app.' });
            console.log(stdout);
        });

        sendCommand.on('exit', function (code) {
            if (code == 2)
                return res.status(500).json({ message: 'App is already started.' });
            else if(code == 1)
                return res.status(500).json({ message: 'App start FAILED.' });
            else{
                app.status = "started";
                app.save();
                return res.status(200).json({ message: 'App has been started.' });
            }
        });
    });
};

exports.stopApp = function(req, res) {};