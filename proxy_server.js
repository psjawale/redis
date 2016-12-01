var http = require('http');
var httpProxy = require('http-proxy');
var ab = require('../app/express-ab')
var express = require('express')
var cookieParser = require('cookie-parser');
var options = {}
var proxy  = httpProxy.createProxyServer(options)
var app = express()
var redis = require('redis');
var client = redis.createClient(6379, 'localhost', {})

var request = 0;
var myPageTest = ab.test('my-fancy-test');

app.use(cookieParser());
var i = 1,j = 1;
var len;
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

var server = http.createServer(function(req, res) {
	client.get("canaryAlertKey", function(err,value){
		if(value == "false") {	
			if (request < 2) {
				request++;
				proxy.web(req, res, {target: "http://localhost:3020"}, function(err, data) {});
			} else if (request == 2) {
				client.rpoplpush('CanaryQueue','CanaryQueue',function(err,canaryUrl){
        			console.log("\nRequest routed to canary server: %s",canaryUrl);
        			proxy.web(req, res, {target: canaryUrl}, function(err, data) {}); 
				});
				request = 0;				
			}
		} else {
			proxy.web(req, res, {target: "http://localhost:3020"}, function(err, data) {});
		}
	});
});
server.listen(3010);

var server = http.createServer(function(req, res) {

    var cookie = req.headers.cookie;
   // console.log(cookie)
    client.llen('ProductionQueue',function(err,data){
    	len = data;
    })
    if(cookie == undefined || len == 1){
    	client.lindex('ProductionQueue',-1,function(err,data){
    	proxy.web(req, res, { target: data});
    	console.log("\nRequest routed to production server:%s",data);
    })
    }else{
    client.get(cookie,function(err, value){
    	if(value == null){
    		console.log("value is null")
    		client.rpoplpush('ProductionQueue','ProductionQueue',function(err,data){
    			console.log(data)
    			client.set(cookie,data)
    			proxy.web(req, res, { target: data});
    			console.log("\nRequest routed to production server: %s",data);
    			if(data == "http://localhost:3001"){
    				i = i +1;
    				client.set('server1',i);
    				console.log(i);
    			}else{
    				j = j + 1;
    				client.set('server2',j);
    				console.log(j);
    			}
    		})
    	}
    	else{
    		console.log(value)
    		proxy.web(req, res, { target: value});	
    		console.log("\nRequest routed to production server: %s",value);
    		if(value == "http://localhost:3001"){
    				i = i +1;
    				client.set('server1',i);
    				console.log(i);
    		}else{
    				j = j + 1;
    				client.set('server2',j);
    				console.log(j);
    		}
    	}
	})
	}
});
server.listen(3020);
