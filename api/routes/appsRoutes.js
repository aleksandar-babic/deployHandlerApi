'use strict';
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var appController = require('../controllers/appsController');

//Ensure request has proper token as query string
router.use('/', function (req, res, next) {
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

router.get('/', function (req, res, next) {
    appController.getAppList(req,res);
});

router.post('/', function (req, res, next) {
    appController.addApp(req,res);
});

router.get('/:appId',function (req,res,next) {
   appController.viewApp(req,res);
});

router.put('/:appId',function (req,res,next) {
    appController.updateApp(req,res);
});

router.delete('/:appId',function (req,res,next) {
    appController.deleteApp(req,res);
});

router.post('/:appId/start', function (req, res, next) {
    appController.startApp(req,res);
});

router.post('/:appId/stop', function (req, res, next) {
    appController.stopApp(req,res);
});

module.exports = router;