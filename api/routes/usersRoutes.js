'use strict';
var express = require('express');
var router = express.Router();
var usersController = require('../controllers/usersController');

router.post('/', function (req, res, next) {
    usersController.register(req,res);
});

router.post('/login', function(req, res, next) {
    usersController.login(req,res);
});

module.exports = router;