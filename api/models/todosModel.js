'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./usersModel');

const TodoSchema = new Schema({
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

TodoSchema.post('remove', todo => {
    User.findById(todo.user, (err, user) => {
        user.todos.pull(todo._id);
        user.save();
    });
});

module.exports = mongoose.model('Todos', TodoSchema);