'use strict';
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var User = require('./usersModel')

var AppSchema = new Schema({
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
        type: String,
        required: true,
        unique: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
});

AppSchema.post('remove', function (app) {
    User.findById(app.user, function (err, user) {
        user.apps.pull(app._id);
        user.save();
    });
});

AppSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Apps', AppSchema);