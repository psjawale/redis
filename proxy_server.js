var http = require('http');
var httpProxy = require('http-proxy');
var express = require('express')
var cookieParser = require('cookie-parser');
var options = {}
var proxy  = httpProxy.createProxyServer(options)
var app = express()
var redis = require('redis');
var client = redis.createClient(6379, 'localhost', {})

var request = 0;

var original_server;

app.use(cookieParser());
var i = 0,j = 0;
var len;

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
    	original_server = data;
    	proxy.web(req, res, { target: data});
        client.set('current_server', data)
    	console.log("\nRequest routed to production server:%s",data);
    })
    }else{
    client.get(cookie,function(err, value){
    	if(value == null){
    		client.rpoplpush('ProductionQueue','ProductionQueue',function(err,data){
    			console.log(data)
    			client.set(cookie,data)
    			proxy.web(req, res, { target: data});
                client.set('current_server', data)
    			console.log("\nRequest routed to production server: %s",data);
    			if(data == original_server){
    				i = i +1;
    				client.set('server1',i);
    			//	console.log(i);
    			}else{
    				j = j + 1;
    				client.set('server2',j);
    			//	console.log(j);
    			}
    		})
    	}
    	else{
    		proxy.web(req, res, { target: value});	
            client.set('current_server', value)
    		console.log("\nRequest routed to production server: %s",value);
    		if(value == original_server){
    				i = i +1;
    				client.set('server1',i);
    			//	console.log(i);
    		}else{
    				j = j + 1;
    				client.set('server2',j);
    			//	console.log(j);
    		}
    	}
	})
	}
});
server.listen(3020);

// var server = http.createServer(function(req, res) {

//     client.rpoplpush('ProductionQueue','ProductionQueue',function(err,data){
//         proxy.web(req, res, { target: data});
//         console.log("\nRequest routed to production server: %s",data);
//     });
// });
// server.listen(5000)
