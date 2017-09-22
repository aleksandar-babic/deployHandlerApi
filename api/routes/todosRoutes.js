'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

const todosController = require('../controllers/todosController');

//Ensure request has proper token as query string
router.use('/', (req, res, next) => {
    jwt.verify(req.query.token, config.security.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

router.get('/', (req, res, next) => {
    todosController.getTodos(req,res,next);
});

router.post('/',(req, res, next) => {
    todosController.addTodo(req,res,next);
});

router.put('/:todoId',(req, res, next) => {
    todosController.setDone(req,res,next);
});

router.delete('/:todoId',(req, res, next) => {
    todosController.deleteTodo(req,res,next);
});

router.delete('/',(req, res, next) => {
    todosController.wipeTodos(req,res,next);
});


module.exports = router;