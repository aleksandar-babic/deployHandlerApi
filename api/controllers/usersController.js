'use strict';
var mongoose = require('mongoose');
var exec = require('child_process').exec;
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SparkPost = require('sparkpost');
var config = require('../../config.json');

var User = require('../models/usersModel');
var App = require('../models/appsModel');
var Todo = require('../models/todosModel');

var client = new SparkPost('96f5957a055e4f682ac6c805e366df20d6ff6ca9');

exports.register = function(req,res){

    if(!req.body.username || !req.body.email || !req.body.password)
        return res.status(500).json({
            message: "Malformed request to register. username, password and e-mail are required."
        });

    if(!req.body.username.toLowerCase() == 'aleksandar')
        return res.status(500).json({
            message: "That username is reserved for our master."
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
    User.findOne({username:req.body.username.toLowerCase()}, function (err,user) {
        if(err)
            return res.status(500).json({
                message: 'Error while registrating new user.',
                error: err
            });
        if(user)
            return res.status(500).json({
                message: 'Username is already taken.'
            });
        User.findOne({email:req.body.email.toLowerCase()}, function (err,user) {
            if(err)
                return res.status(500).json({
                    message: 'Error while registrating new user',
                    error: err
                });
            if(user)
                return res.status(500).json({
                    message: 'E-mail is already used by user ' + user.username + '.'
                });

            var sendCommand = exec("bash "+ config.general.workingDir + "util/addUser.sh " + req.body.username.toLowerCase()+' '+ req.body.password, function(err, stdout, stderr) {
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
                        username: req.body.username.toLowerCase(),
                        password: bcrypt.hashSync(req.body.password, 10),
                        email: req.body.email.toLowerCase()
                    });
                    user.save(function (err, result) {
                        if(err)
                            return res.status(500).json({
                                message: 'Error while registrating new user.',
                                error: err
                            });

                        var firstDefaultTodo = new Todo({
                            message: 'Register on DeployHandler platform',
                            isComplete: true,
                            user: result._id
                        });

                        firstDefaultTodo.save(function (err,res) {
                            var secondDefaultTodo = new Todo({
                                message: 'Explore DeployHandler',
                                isComplete: false,
                                user: result._id
                            });

                            secondDefaultTodo.save();

                            var thirdDefaultTodo = new Todo({
                                message: 'Deploy my first app',
                                isComplete: false,
                                user: result._id
                            });

                            thirdDefaultTodo.save();
                        });

                        client.transmissions.send({
                            options: {
                                sandbox: false
                            },
                            content: {
                                from: 'DeployHandler<donotreply@deployhandler.com>',
                                subject: 'Welcome to DeployHandler, ' + result.username + '!',
                                html:'<html><body><h2>Nice to meet you!</h2><p>Welcome to our DeployHandler platform. Good job! Now go ahead and deploy your first app' +
                                ', trust us, its really easy.<br/></p><p>Have a nice day, your DeployHandler team.</p></body></html>'
                            },
                            recipients: [
                                {address: result.email}
                            ]
                        })
                            .then(data => {
                                return res.status(201).json({
                                    message: 'User created successfully.',
                                    obj: result
                                });
                            })
                            .catch(err => {
                                return res.status(500).json({
                                    message: 'User created successfully, but failed to send welcome mail.',
                                    obj: result
                                });
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

    User.findOne({username:req.body.username.toLowerCase()}, function (err,user) {
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
        var token = jwt.sign({user: user}, config.security.jwtSecret, {expiresIn: Number(config.security.loginTokenExpire)});
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
                    });

                client.transmissions.send({
                    options: {
                        sandbox: false
                    },
                    content: {
                        from: 'DeployHandler<donotreply@deployhandler.com>',
                        subject: 'Warning, ' + user.username + ', your password has been changed!',
                        html:'<html><body><h2>Warning!</h2><p>Your password has been changed, if this action was not done by you please contact our Administrators immediately!.<br/></p>' +
                        '<p>Have a nice day, your DeployHandler team.</p></body></html>'
                    },
                    recipients: [
                        {address: user.email}
                    ]
                })
                    .then(data => {
                        return res.status(200).json({success:true});
                    })
                    .catch(err => {
                        return res.status(200).json({
                            success:true,
                            'message': 'Password has been changed, but notice email was not sent.'
                        });
                    });
            });
        });
    });
};

//TODO Change domain once live
exports.forgotPasswordSendMail = function (req,res) {
    if(!req.body.email && !req.body.username)
        return res.status(500).json({
            message: 'Email address, or username is required in order to reset password.'
        });

    User.findOne({$or: [{'username':req.body.username},{'email':req.body.email}]},function (err,user) {
        if(err)
            return res.status(500).json({
                message: 'An error occurred while creating password reset link.',
            });
        if(!user)
            return res.status(404).json({
                message: 'Cannot find user with that username/email',
            });

        //Signing new token ,putting whole user object in it, token is valid for 5 minutes
        var token = jwt.sign({user: user,resetPw:true}, config.security.jwtSecret, {expiresIn: Number(config.security.pwResetTokenExpire)});
        var resetUrl = config.general.protocolFrontend + '://'+ config.general.domainFrontend + '/#/resetpw?token=' + token;
        //Send Email to user
        client.transmissions.send({
            options: {
                sandbox: false
            },
            content: {
                from: 'DeployHandler<donotreply@deployhandler.com>',
                subject: 'Password reset request - DeployHandler',
                html:'<html><body><h3>Hi there,</h3><p>We are sending you this email beacuse you sent password reset request. ' +
                'Below is URL which will help you reset your password. For security reasons, URL is valid only for 5 minutes.</p><br/>' +
                '<a href="' + resetUrl + '" target="_blank">Click here to reset your password.</a><br/><p>We hope you enjoy using our platform. Your DeployHandler.</p></body></html>'
            },
            recipients: [
                {address: user.email}
            ]
        })
            .then(data => {
                return res.status(200).json({
                    'message': 'Password reset email has been sent to you',
                    'success': true
                });
            })
            .catch(err => {
                return res.status(500).json({
                    'message': 'Error while sending password reset email.',
                    'success': false
                });
            });
    });
};

exports.forgotPasswordAction = function (req,res) {
    if(!req.query.token)
        return res.status(500).json({
            message: 'Secure token is required in order to reset password.'
        });
    if(!req.body.password || !req.body.password2)
        return res.status(500).json({
            message: 'Both passwords are required.'
        });

    if(req.body.password != req.body.password2)
        return res.status(500).json({
            message: 'Passwords do not match.'
        });

    var decoded = jwt.decode(req.query.token);

    if(!decoded.resetPw)
        return res.status(500).json({
            message: 'Secure token is not valid.'
        });

    User.findOne({username:decoded.user.username},function (err,user) {
        if(err)
            return res.status(500).json({
                message: 'An error occurred while changing password.',
                success: false
            });

        //Set new password on server
        var prepareCommand = 'yes ' + req.body.password + ' | passwd ' + user.username + ' > /dev/null 2>&1';
        var sendCommand = exec(prepareCommand, function(err, stdout, stderr) {
            if(stderr)
                console.log(stderr);
        });

        sendCommand.on('exit', function (code) {
            if (code != 0)
                return res.status(500).json({
                    message: 'An error occurred while changing password on server.',
                    success: false
                });

            //Set new password in db
            user.password = bcrypt.hashSync(req.body.password, 10);
            user.save(function (err) {
                if(err)
                    return res.status(500).json({
                        message: 'An error occurred while setting new password.',
                    });
                res.status(200).json({
                    message:'Password reset was successful.',
                    success:true
                });
            });
        });
    });
};

exports.closeAccount = function (req,res) {
    var decoded = jwt.decode(req.query.token);
    User.findOne({username:decoded.user.username},function (err,user) {
        if(decoded.user._id != user._id)
            return res.status(403).json({
                message: 'You are allowed to close only your account.'
            });

        //Remove all apps from server and remove user from server(including users home dir)
        var prepareCommand = config.general.workingDir + 'util/removeUser.sh ' + user.username;
        var sendCommand = exec(prepareCommand, function(err, stdout, stderr) {
            if(stderr)
                console.log(stderr);
        });
        sendCommand.on('exit',function (code) {
            if(code != 0)
                return res.status(500).json({
                    message: 'Error while deleting user data from server.'
                });

                //Delete all Todos from user
                Todo.remove({user:user._id},function (err) {
                    if (err)
                        return res.status(500).json({
                            message: 'Error while deleting users Todos'
                        });
                    //Delete all Apps from user
                    App.remove({user:user._id},function (err) {
                        if (err)
                            return res.status(500).json({
                                message: 'Error while deleting users Apps'
                            });
                        //Actually remove user from db
                        user.remove(function (err) {
                            if (err)
                                return res.status(500).json({
                                    message: 'Error while deleting user'
                                });
                            //Everything went well, everything is wiped
                            return res.status(200).json({
                                message: 'Sorry to see you leaving. Have a good one.'
                            });
                        });
                    });
                });
        });
    });
}

