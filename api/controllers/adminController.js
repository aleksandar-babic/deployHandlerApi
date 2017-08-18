'use strict';
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var App = require('../models/appsModel');
var User = require('../models/usersModel');

exports.getAppsList = function(req, res) {
    App.find().populate('user').exec(function (err,apps) {
        if (err)
            return res.status(500).json({
                message: 'Error while fetching all apps.',
                obj: err
            });
        return res.status(200).json(apps);
    });
};

exports.getUsers = function (req,res) {
    if(req.query.onlyAdmins && req.query.onlyAdmins === 'true'){
        User.find({'isAdmin':true},function (err,users) {
           if(err)
               return res.status(500).json({
                   message: 'Error while fetching admins.',
                   obj: err
               });
            var i,total=users.length,filteredResult = [];
            for(i = 0;i<total;++i){
                filteredResult[i] = {
                    username:users[i].username,
                    email:users[i].email,
                    todos:users[i].todos.length,
                    apps:users[i].apps.length,
                    registrated:users[i].createdDate
                }
            }
            return res.status(200).json(filteredResult);
        });
    }else if((req.query.onlyAdmins && req.query.onlyAdmins === 'false') || !req.query.onlyAdmins){
        User.find({},function (err,users) {
            if (err)
                return res.status(500).json({
                    message: 'Error while fetching all users.',
                    obj: err
                });
            var i,total=users.length,filteredResult = [];
            for(i = 0;i<total;++i){
                filteredResult[i] = {
                    username:users[i].username,
                    email:users[i].email,
                    todos:users[i].todos.length,
                    apps:users[i].apps.length,
                    registrated:users[i].createdDate
                }
            }
            return res.status(200).json(filteredResult);
        });
    }
};
