var express = require('express');
var http = require('http');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var static = require('serve-static');
var path = require('path');


var app = express();

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.set('port', 5001);
app.use(express.static('public'));
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/uploads',express.static(path.join(__dirname, '/uploads')));
app.use('/musiclist',express.static(path.join(__dirname, '/musiclist')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/', require('./SNS_2.js'));

http.createServer(app).listen(app.get('port'), function(){
    console.log("express start : %d", app.get('port'));
});