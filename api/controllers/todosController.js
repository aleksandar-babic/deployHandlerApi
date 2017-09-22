'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Todo = require('../models/todosModel');
const User = require('../models/usersModel');

exports.getTodos = (req, res, next) => {
    const decoded = jwt.decode(req.query.token);
    Todo.find({'user': decoded.user._id}, (err, todos) => {
        if (err)
            return res.status(500).send(err);
        return res.status(200).json(todos);
    });
};

exports.addTodo = (req, res, next) => {
    if(!req.body.message)
        return res.status(500).json({
            message: 'Todo message is required.'
        });
    const decoded = jwt.decode(req.query.token);
    User.findById(decoded.user._id,(err, user) => {
        if (err)
            return res.status(500).send(err);
        if(!user)
            return res.status(500).json({
                message: 'Could not find user with that id.'
            });
        const todo = new Todo({message:req.body.message,user:user._id});
        todo.save((err, result) => {
            if(err)
                return res.status(500).json({
                    message: 'Error while saving Todo.', obj:err
                });
            user.todos.push(todo);
            user.save(err => {
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

exports.setDone = (req, res, next) => {
    if(!req.params.todoId)
        return res.status(500).json({
            message: 'Todo ID is required.'
        });
    if(!req.body.complete)
        return res.status(500).json({
            message: 'Todo status (true/false) is required.'
        });
    Todo.findById(req.params.todoId,(err, todo) => {
        if (err)
            return res.status(500).send(err);
        if(!todo)
            return res.status(404).json({
                message: 'Todo with that ID does not exist.'
            });
        const decoded = jwt.decode(req.query.token);
        if(todo.user != decoded.user._id)
            return res.status(401).json({
                message: 'That Todo does not belong to you.'
            });
        todo.isComplete = (req.body.complete.toLowerCase() == 'true');
        todo.save(err => {
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

exports.deleteTodo = (req, res, next) => {
    if(!req.params.todoId)
        return res.status(500).json({
            message: 'Todo ID is required.'
        });
    Todo.findById(req.params.todoId,(err, todo) => {
        if(err)
            return res.status(500).json({
                message: 'Error while finding todo with that id.', obj:err
            });

        if(!todo)
            return res.status(404).json({
                message: 'Todo with that ID does not exist.'
            });

        const decoded = jwt.decode(req.query.token);
        if(todo.user != decoded.user._id)
            return res.status(401).json({
                message: 'That Todo does not belong to you.'
            });

        todo.remove(err => {
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

exports.wipeTodos = (req, res, next) => {
    const decoded = jwt.decode(req.query.token);
    Todo.remove({'user': decoded.user._id}, err => {
        if (err)
            return res.status(500).send(err);

        User.findById(decoded.user._id,(err, user) => {
            if(err)
                return res.status(500).json({
                    message: 'Error while finding user with that id.', obj:err
                });

            if(!user)
                return res.status(500).json({
                    message: 'User with that id does not exist.'
                });
            user.todos = [];
            user.save(err => {
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
