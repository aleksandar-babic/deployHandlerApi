'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

const statsController = require('../controllers/statsController');

//Ensure request has proper token as query string
router.use('/', (req, res, next) => {
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

router.get('/', (req, res, next) => {
    statsController.getStats(req,res);
});


module.exports = router;