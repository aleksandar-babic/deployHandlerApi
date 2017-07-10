'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TodoSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
    isComplete:{
        type: Boolean,
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