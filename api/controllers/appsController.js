'use strict';
var mongoose = require('mongoose'),
    App = require('../models/appsModel')

exports.getAppList = function(req, res) {
    App.find({}, function(err, app) {
        if (err)
            res.status(500).send(err);
        res.status(200).json(app);
    });
};

exports.addApp = function(req, res) {
    var app = new App(req.body);
    app.save(function(err, app) {
        if (err)
            res.status(500).send(err);
        res.status(201).json(app);
    });
};

exports.viewApp = function(req, res) {
    App.findById(req.params.appId, function(err, app) {
        if (err)
            res.status(500).send(err);
        if (!app)
            res.status(404).json({ message: 'Could not find app with that id.' });
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
    App.remove({
        _id: req.params.appId
    }, function(err, app) {
        if (err)
            res.status(404).send(err);
        res.status(200).json({ message: 'App has been deleted.' });
    });
};
