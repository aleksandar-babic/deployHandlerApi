'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const os = require('os-utils');

const App = require('../models/appsModel');

exports.getStats = (req, res) => {
    const decoded = jwt.decode(req.query.token);
    const stats = {
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
    App.find({'user': decoded.user._id}, (err, apps) => {
        if (err)
            return res.status(500).send(err);
        apps.forEach(app => {
            stats.apps.total ++;
            if(app.status == 'started')
                stats.apps.running++;
        });
        os.cpuUsage(v => {
            stats.cpu.load=parseFloat(v).toFixed(2);
            stats.cpu.usage=parseFloat(v).toFixed(2) * 100.0;
            stats.ram.usage = parseFloat(1-os.freememPercentage()).toFixed(2) * 100.0;
            stats.ram.total=parseFloat(os.totalmem()).toFixed(0);
            stats.ram.free=parseFloat(os.freemem()).toFixed(0);
            return res.status(200).json(stats);
        });
    });
};
