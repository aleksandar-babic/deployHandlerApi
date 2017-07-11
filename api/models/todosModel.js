'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = require('./usersModel');

var TodoSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
    isComplete:{
        type: Boolean,
        default: false
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
});

TodoSchema.post('remove', function (todo) {
    User.findById(todo.user, function (err, user) {
        user.todos.pull(todo._id);
        user.save();
    });
});

module.exports = mongoose.model('Todos', TodoSchema);