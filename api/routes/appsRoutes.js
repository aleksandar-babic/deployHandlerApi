'use strict';
var express = require('express');
var router = express.Router();
var appController = require('../controllers/appsController');



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

router.post('/start/:appId', function (req, res, next) {
    appController.startApp(req,res);
});

router.post('/stop/:appId', function (req, res, next) {
    appController.stopApp(req,res);
});

router.get('/status/:appId',function (req,res,next) {
    appController.checkAppStatus(req,res);
});

module.exports = router;