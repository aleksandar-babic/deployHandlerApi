'use strict';
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var Todo = require('../models/todosModel');
var User = require('../models/usersModel');

exports.getTodos = function (req,res,next) {
    var decoded = jwt.decode(req.query.token);
    Todo.find({'user': decoded.user._id}, function(err, todos) {
        if (err)
            return res.status(500).send(err);
        return res.status(200).json(todos);
    });
};

exports.addTodo = function (req,res,next) {
    if(!req.body.message)
        return res.status(500).json({
            message: 'Todo message is required.'
        });
    var decoded = jwt.decode(req.query.token);
    User.findById(decoded.user._id,function (err,user) {
        if (err)
            return res.status(500).send(err);
        if(!user)
            return res.status(500).json({
                message: 'Could not find user with that id.'
            });
        var todo = new Todo({message:req.body.message,user:user._id});
        todo.save(function (err,result) {
            if(err)
                return res.status(500).json({
                    message: 'Error while saving Todo.', obj:err
                });
            user.todos.push(todo);
            user.save(function (err) {
                if(err)
                    return res.status(500).json({
                        message: 'Error while saving Todo.', obj:err
                    });
                return res.status(201).json({
                    message:'Todo has been added!',
                    obj: result
                });
            });
        });
    });
};

exports.setDone = function (req,res,next) {
    if(!req.params.todoId)
        return res.status(500).json({
            message: 'Todo ID is required.'
        });
    if(!req.body.complete)
        return res.status(500).json({
            message: 'Todo status (true/false) is required.'
        });
    Todo.findById(req.params.todoId,function (err,todo) {
        if (err)
            return res.status(500).send(err);
        if(!todo)
            return res.status(404).json({
                message: 'Todo with that ID does not exist.'
            });
        var decoded = jwt.decode(req.query.token);
        if(todo.user != decoded.user._id)
            return res.status(401).json({
                message: 'That Todo does not belong to you.'
            });
        todo.isComplete = (req.body.complete.toLowerCase() == 'true');
        todo.save(function (err) {
            if(err)
                return res.status(500).json({
                    message: 'Error while saving Todo.', obj:err
                });
            return res.status(200).json({
                message:'Todo has been updated!'
            });
        });
    });
};

exports.deleteTodo = function (req,res,next) {
    if(!req.params.todoId)
        return res.status(500).json({
            message: 'Todo ID is required.'
        });
    Todo.findById(req.params.todoId,function (err,todo) {
        if(err)
            return res.status(500).json({
                message: 'Error while finding todo with that id.', obj:err
            });

        if(!todo)
            return res.status(404).json({
                message: 'Todo with that ID does not exist.'
            });

        var decoded = jwt.decode(req.query.token);
        if(todo.user != decoded.user._id)
            return res.status(401).json({
                message: 'That Todo does not belong to you.'
            });

        todo.remove(function (err) {
            if(err)
                return res.status(500).json({
                    message: 'Error while deleting Todo.', obj:err
                });
            return res.status(200).json({
                message: 'Todo has been deleted.'
            });
        });
    });

};

exports.wipeTodos = function (req,res,next) {
    var decoded = jwt.decode(req.query.token);
    Todo.remove({'user': decoded.user._id}, function(err) {
        if (err)
            return res.status(500).send(err);

        User.findById(decoded.user._id,function (err,user) {
            if(err)
                return res.status(500).json({
                    message: 'Error while finding user with that id.', obj:err
                });

            if(!user)
                return res.status(500).json({
                    message: 'User with that id does not exist.'
                });
            user.todos = [];
            user.save(function (err) {
                if(err)
                    return res.status(500).json({
                        message: 'Error while deleting Todos from user.', obj:err
                    });
                return res.status(200).json({
                    message: 'All Todos have been wiped.'
                });
            });
        });
    });
};
