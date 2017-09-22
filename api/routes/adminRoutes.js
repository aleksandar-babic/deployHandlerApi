'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config.json');
const adminController = require('../controllers/adminController');

//Ensure request has proper token as query string
router.use('/', (req, res, next) => {
    jwt.verify(req.query.token, config.security.jwtSecret, (err, decoded) => {
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

router.get('/apps', (req, res, next) => {
    adminController.getAppsList(req,res);
});

router.get('/users',(req, res, next) => {
   adminController.getUsers(req,res);
});


module.exports = router;