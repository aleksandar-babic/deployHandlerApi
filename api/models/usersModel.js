'use strict';
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    apps:[{
        type: Schema.Types.ObjectId,
        ref: 'Apps'
    }],
    todos:[{
        type: Schema.Types.ObjectId,
        ref: 'Todos'
    }],
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    }
});

UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Users', UserSchema);