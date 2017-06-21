'use strict';
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var os = require('os-utils');

var App = require('../models/appsModel');

//TODO DOCS For stats
exports.getStats = function(req, res) {
    var decoded = jwt.decode(req.query.token);
    var stats = {
        cpu:{
            load:0,
            usage:0,
        },
        ram:{
            total:0,
            free:0,
            usage:0
        },
        apps:{
            total:0,
            running:0
        }
    };

    App.find({'user': decoded.user._id}, function(err, apps) {
        if (err)
            return res.status(500).send(err);
        apps.forEach(function (app) {
            stats.apps.total ++;
            if(app.status == 'running')
                stats.apps.running++;
        });

        os.cpuUsage(function(v){
            stats.cpu.usage=parseFloat(v).toFixed(2) * 100.0;
            stats.ram.usage = parseFloat(1-os.freememPercentage()).toFixed(2) * 100.0;
            stats.ram.total=parseFloat(os.totalmem()).toFixed(0);
            stats.ram.free=parseFloat(os.freemem()).toFixed(0);
            return res.status(200).json(stats);
        });
    });
};
