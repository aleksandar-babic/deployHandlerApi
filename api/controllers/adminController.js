'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const App = require('../models/appsModel');
const User = require('../models/usersModel');

exports.getAppsList = (req, res) => {
    App.find().populate('user').exec((err, apps) => {
        if (err)
            return res.status(500).json({
                message: 'Error while fetching all apps.',
                obj: err
            });
        return res.status(200).json(apps);
    });
};

exports.getUsers = (req, res) => {
    if(req.query.onlyAdmins && req.query.onlyAdmins === 'true'){
        User.find({'isAdmin':true},(err, users) => {
            if(err)
                return res.status(500).json({
                    message: 'Error while fetching admins.',
                    obj: err
                });
            let i;
            const total=users.length;
            const filteredResult = [];
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
        User.find({},(err, users) => {
            if (err)
                return res.status(500).json({
                    message: 'Error while fetching all users.',
                    obj: err
                });
            let i;
            const total=users.length;
            const filteredResult = [];
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
