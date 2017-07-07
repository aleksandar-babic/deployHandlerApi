'use strict';
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var usersController = require('../controllers/usersController');

router.post('/', function (req, res, next) {
    usersController.register(req,res);
});

router.post('/login', function(req, res, next) {
    usersController.login(req,res);
});

//Ensure request has proper token as query string
router.use('/changepw', function (req, res, next) {
    jwt.verify(req.query.token, 'secret', function (err, decoded) {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.post('/changepw',function (req,res,next) {
    usersController.changePassword(req,res);
});

module.exports = router;