'use strict';
var mongoose = require('mongoose');
var sys = require('util');
var exec = require('child_process').exec;
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var User = require('../models/usersModel');

exports.register = function(req,res){

    if(!req.body.username || !req.body.email || !req.body.password)
        return res.status(500).json({
            message: "Malformed request to register. username, password and e-mail are required."
        });
    User.findOne({username:req.body.username}, function (err,user) {
        if(err)
            return res.status(500).json({
                message: 'Error while registrating new user.',
                error: err
            });
        if(user)
            return res.status(500).json({
                message: 'Username is already taken.'
            });
        User.findOne({email:req.body.email}, function (err,user) {
            if(err)
                return res.status(500).json({
                    message: 'Error while registrating new user',
                    error: err
                });
            if(user)
                return res.status(500).json({
                    message: 'E-mail is already used by user ' + user.username + '.'
                });

            var sendCommand = exec("bash /root/scripts/addUser.sh " + req.body.username+' '+ req.body.password, function(err, stdout, stderr) {
                console.log("STDOUT: "+stdout);
                console.log("STDERR: "+stderr);
            });
            sendCommand.on('exit', function (code) {
                if (code != 0) {
                    return res.status(500).json({
                        message: 'An error occurred while registrating user on server.'
                    });
                }
                else {
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
                }
            });
        })
    });
};

exports.login = function(req,res){
    if(!req.body.username || !req.body.password)
        return res.status(500).json({
            message: 'Both username and password are required.'
        });

    User.findOne({username:req.body.username}, function (err,user) {
        if (err)
            return res.status(500).json({
                message: 'An error occurred while logging in.',
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

