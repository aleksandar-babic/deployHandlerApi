'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AppSchema = new Schema({
    name: {
        type: String
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
        type: String
    },
    user:{
        type: String
    }
});

module.exports = mongoose.model('Apps', AppSchema);