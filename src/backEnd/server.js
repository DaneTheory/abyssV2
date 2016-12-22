'use strict';

var express = require('express');
var app = express();
var router = express.Router();
var path = require('path');

app.use(express.static('environments'));

app.get('/', function(req, res) {
    res.sendFile(path.join(process.cwd(), 'environments', 'dev' + '/index.html' ));
});

app.listen(5000);
