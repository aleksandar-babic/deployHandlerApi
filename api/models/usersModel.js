'use strict';
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;


var UserSchema = new Schema({
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
    }]
});

UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Users', UserSchema);