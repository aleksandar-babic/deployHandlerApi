'use strict';
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var User = require('../models/usersModel');

exports.register = function(req,res){
    var user = new User({
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 10),
        email: req.body.email
    });
    user.save(function (err, result) {
        if(err)
            return res.status(500).json({
                message: 'Error while registrating new user.',
                error: err
            });
        res.status(201).json({
            message: 'User created successfully.',
            obj: result
        });
    });
};

exports.login = function(req,res){
    User.findOne({username:req.body.username}, function (err,user) {
        if (err)
            return res.status(500).json({
                title: 'An error occurred while logging in.',
                error: err
            });
        //True if no user found in database
        if (!user)
            return res.status(401).json({
                message: 'Login failed',
                error: {message: 'Invalid login credentials'}
            });
        // True if password from request does not match decrypted database password
        if (!bcrypt.compareSync(req.body.password, user.password))
            return res.status(401).json({
                message: 'Login failed',
                error: {message: 'Invalid login credentials'}
            });
        //Signing new token ,putting whole user object in it
        var token = jwt.sign({user: user}, 'secret', {expiresIn: 7200});
        //Returning JSON with token
        res.status(200).json({
            message: 'Successfully logged in',
            token: token,
            userId: user._id
        });
    });
};

