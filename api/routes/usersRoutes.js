'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

const usersController = require('../controllers/usersController');

router.post('/', (req, res, next) => {
    usersController.register(req,res);
});

router.post('/login', (req, res, next) => {
    usersController.login(req,res);
});

//Ensure request has proper token as query string
router.use('/changepw', (req, res, next) => {
    jwt.verify(req.query.token, config.security.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.post('/changepw',(req, res, next) => {
    usersController.changePassword(req,res);
});

router.post('/forgotpw',(req, res, next) => {
    usersController.forgotPasswordSendMail(req,res);
});

//Ensure request has proper token as query string
router.use('/forgotpwaction', (req, res, next) => {
    jwt.verify(req.query.token, config.security.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: 'Token missing or token expired',
                error: err
            });
        }
        next();
    })
});

router.post('/forgotpwaction',(req, res, next) => {
    usersController.forgotPasswordAction(req,res);
});

//Ensure request has proper token as query string
router.use('/close-account', (req, res, next) => {
    jwt.verify(req.query.token, config.security.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.delete('/close-account',(req, res) => {
    usersController.closeAccount(req,res);
});

module.exports = router;