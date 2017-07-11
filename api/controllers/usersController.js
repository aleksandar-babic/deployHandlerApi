'use strict';
var mongoose = require('mongoose');
var exec = require('child_process').exec;
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var User = require('../models/usersModel');

exports.register = function(req,res){

    if(!req.body.username || !req.body.email || !req.body.password)
        return res.status(500).json({
            message: "Malformed request to register. username, password and e-mail are required."
        });
    if(/\s/.test(req.body.username))
        return res.status(500).json({
            message: 'Username cannot contain any spaces.'
        });
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!emailRegex.test(req.body.email))
        return res.status(500).json({
            message: 'E-mail address is not valid.'
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
                message: 'Invalid login credentials'
            });
        // True if password from request does not match decrypted database password
        if (!bcrypt.compareSync(req.body.password, user.password))
            return res.status(401).json({
                message: 'Invalid login credentials'
            });
        //Signing new token ,putting whole user object in it
        var token = jwt.sign({user: user}, 'secret', {expiresIn: 1200});
        //Returning JSON with token
        res.status(200).json({
            message: 'Successfully logged in',
            token: token,
            userId: user._id
        });
    });
};

exports.changePassword = function (req,res) {
    if(!req.body.current || !req.body.new)
        return res.status(500).json({
            message: 'Both current and new password are required'
        });
    if(req.body.current.length < 6 || req.body.new.length < 6)
        return res.status(500).json({
            message: 'Minimum allowed length of password is 6'
        });
    if(req.body.current == req.body.new)
        return res.status(500).json({
            message: 'New password cannot be same as current password.'
        });

    var decoded = jwt.decode(req.query.token);
    User.findOne({username:decoded.user.username},function (err,user) {
        if(err)
            return res.status(500).json({
                message: 'An error occurred while changing password.',
                error: err
            });
        //Verify that current password from request is correct
        if (!bcrypt.compareSync(req.body.current, user.password))
            return res.status(401).json({
                message: 'Wrong current password'
            });

        //Set new password on server
        var prepareCommand = 'yes ' + req.body.new + ' | passwd ' + user.username + ' > /dev/null 2>&1';
        var sendCommand = exec(prepareCommand, function(err, stdout, stderr) {
            if(stderr)
                console.log(stderr);
        });

        sendCommand.on('exit', function (code) {
            if (code != 0)
                return res.status(500).json({
                    message: 'An error occurred while changing password on server.'
                });

            //Set new password in db
            user.password = bcrypt.hashSync(req.body.new, 10);
            user.save(function (err) {
                if(err)
                    return res.status(500).json({
                        message: 'An error occurred while changing password.',
                        error: err
                    });
                res.status(200).json({success:true});
            });
        });
    });
};

