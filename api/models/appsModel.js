'use strict';
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const User = require('./usersModel');

const AppSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        uniqueCaseInsensitive: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: [{
            type: String,
            enum: ['started', 'stopped']
        }],
        default: ['stopped']
    },
    entryPoint:{
        type: String,
        required: true
    },
    port:{
        type: Number,
        min: 1024,
        max: 49150,
        required: true,
        unique: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
});

AppSchema.post('remove', app => {
    User.findById(app.user, (err, user) => {
        user.apps.pull(app._id);
        user.save();
    });
});

AppSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Apps', AppSchema);