'use strict';
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../../config.json');

var statsController = require('../controllers/statsController');

//Ensure request has proper token as query string
router.use('/', function (req, res, next) {
    jwt.verify(req.query.token, config.security.jwtSecret, function (err, decoded) {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.get('/', function (req, res, next) {
    statsController.getStats(req,res);
});


module.exports = router;