'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

const appController = require('../controllers/appsController');

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
    appController.getAppList(req,res);
});

router.post('/', (req, res, next) => {
    appController.addApp(req,res);
});

router.get('/:appId',(req, res, next) => {
   appController.viewApp(req,res);
});

router.put('/:appId',(req, res, next) => {
    appController.updateApp(req,res);
});

router.delete('/:appId',(req, res, next) => {
    appController.deleteApp(req,res);
});

router.post('/:appId/start', (req, res, next) => {
    appController.startApp(req,res);
});

router.post('/:appId/stop', (req, res, next) => {
    appController.stopApp(req,res);
});

router.post('/:appId/install', (req, res, next) => {
    appController.npmInstall(req,res);
});

module.exports = router;