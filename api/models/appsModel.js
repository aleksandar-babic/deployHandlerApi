'use strict';
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;


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
        type: String
    }
});

AppSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Apps', AppSchema);