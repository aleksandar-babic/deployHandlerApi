'use strict';
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var todosController = require('../controllers/todosController');

//Ensure request has proper token as query string
router.use('/', function (req, res, next) {
    jwt.verify(req.query.token, 'secret', function (err, decoded) {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.get('/', function (req, res, next) {
    todosController.getTodos(req,res,next);
});

router.post('/',function (req,res,next) {
    todosController.addTodo(req,res,next);
});

router.delete('/:todoId',function (req,res,next) {
    todosController.deleteTodo(req,res,next);
});

router.delete('/',function (req,res,next) {
    todosController.wipeTodos(req,res,next);
});


module.exports = router;