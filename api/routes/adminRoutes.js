'use strict';
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../../config.json');
var adminController = require('../controllers/adminController');

//Ensure request has proper token as query string
router.use('/', function (req, res, next) {
    jwt.verify(req.query.token, config.security.jwtSecret, function (err, decoded) {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        if(!decoded.user.isAdmin){
            console.log(decoded.user);
            return res.status(401).json({
                title: 'You are not Admin',
                error:{
                    name: 'JsonWebTokenError',
                    message: 'jwt provided, but not admin'
                }
            });
        }
        next();
    })
});

router.get('/apps', function (req, res, next) {
    adminController.getAppsList(req,res);
});

router.get('/users',function (req,res,next) {
   adminController.getUsers(req,res);
});


module.exports = router;