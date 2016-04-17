var express = require('express');
var fs = require('fs');
var logger = require('winston');
var https = require("https");
var ws = require('ws').Server;
var errorhandler = require('errorhandler');
var portFinder = require('portfinder');
var _ = require("underscore");
var bt = require("bt");

var config = require('./bt-tunnle.json')

var privateKey = fs.readFileSync(config.privateKey).toString();
var publicKey = fs.readFileSync(config.certificate).toString();

var credentials = {
    key: privateKey,
    cert: publicKey
};

var app = express();
app.use(errorhandler());

var server = https.createServer(credentials, app);

server.listen(parseInt(config.serverPort));

var wss = new ws({
    server: server
});

var socket;
var sshPortMap = {};
var vncPortMap = {};

wss.on('connection', function (ws) {

    socket = ws;
    logger.info("Connected ..");
    
    ws.on('message', function (message) {
        var m = JSON.parse(message);

        var command = m.name;
        var id = parseInt(m.data.id);

        return execute(command, id);
    });
    
});

function execute (command, id) {
    switch (command) {
        case "ssh":
            createSsh(id);
            break;
        case "vnc":
            createVnc(id);
            break;
    }
}

process.on('uncaughtException', function (err) {
    logger.error(err);
});


function createSsh(id) {
    if(sshPortMap[id]) {
        logger.info("Found connection to %s with local port %s", id, sshPortMap[id]);
        startGnomeTerminalSsh(sshPortMap[id]);
    } else {
        tunnle(id, sshPortMap, function () {
           setTimeout(function () {
               startGnomeTerminalSsh(sshPortMap[id]);
           }, 5000);
        });
    }
}

function tunnle(remotePort, holder, callback) {
    portFinder.getPort({
        port: 64000
    }, function (err, localPort) {
        if(err) {
            logger.error(err);
            return;
        } else {
            var options = {
                username : config.tunnle.username,
                localPort: localPort,
                remotePort : remotePort,
                remoteHost : config.tunnle.dstHost
            }

            logger.info("tunneling %s", options);

            bt.tunnle(options, function (err) {
                if(err) {
                    logger.error(err);
                    delete holder[remotePort];
                }
            });

            holder[remotePort] = localPort;

            setTimeout(function () {
                callback();
            }, 10000);
        }
    });
}

function startGnomeTerminalSsh(localPort) {
    var options = {
        localPort: localPort
    }

    bt.remoteTerminal(options, function (error) {
        if (error) {
            logger.error(error);
        } else {
            logger.info("GNOME terminal open port %s", localPort);
        }
    });
}

function startRemoteDesktop (localPort) {
    var options = {
        localPort : localPort
    };

    bt.remoteDesktop(options, function (error) {
        if (error) {
            logger.error(error);
        } else {
            logger.info("Remote desktop open port %s", localPort);
        }
    });
}

function createVnc(sshPort){
    var vncPort = parseInt(sshPort) + 1; // vnc port is one greater than ssh port;
    if(vncPortMap[vncPort]) {
        logger.info("Found connection to %s with local port %s", vncPort, vncPortMap[vncPort]);
        startRemoteDesktop(vncPortMap[vncPort]);
    } else {
        tunnle(vncPort, vncPortMap, function () {
            startRemoteDesktop(vncPortMap[vncPort]);
        });
    }
}

function destroyTunnle(localPort) {
    var options = {
        localPort: localPort
    }

    bt.destroy(options, function (err) {
        if(err) {
            logger.error(err);
        } else {
            logger.info("Tunnle destroyed %s.", localPort);
        }
    });
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    var sshKeys = Object.keys(sshPortMap);
    var vncKeys = Object.keys(vncPortMap);
    
    _.each(sshKeys, function (item, index) {
        destroyTunnle(sshPortMap[item]);
    });

    _.each(vncKeys, function (item, index) {
        destroyTunnle(sshPortMap[item]);
    });

    process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));