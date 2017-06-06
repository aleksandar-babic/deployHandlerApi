'use strict';
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var User = require('./usersModel')

var AppSchema = new Schema({
    name: {
        type: String,
        unique: true,
        uniqueCaseInsensitive: true
    },
    Created_date: {
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
        type: String
    },
    port:{
        type: String,
        unique: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
});

AppSchema.post('remove', function (app) {
    User.findById(app.user, function (err, user) {
        user.apps.pull(app);
        user.save();
    });
});

AppSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Apps', AppSchema);