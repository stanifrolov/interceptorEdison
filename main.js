/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting

var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console
//var myOnboardLed = new mraa.Gpio(3, false, true); //LED hooked up to digital pin (or built in pin on Galileo Gen1)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output
var ledState = true; //Boolean to hold the state of Led

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersArray = [];
var userId;

app.get('/', function(req, res) {
    //Join all arguments together and normalize the resulting path.
    res.sendFile(path.join(__dirname + '/client', 'index.html'));
});

//Allow use of files in client folder
app.use(express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

//Socket.io Event handlers
io.on('connection', function(socket) {
    console.log("\n Add new User: u"+connectedUsersArray.length);
    if(connectedUsersArray.length > 0) {
        var element = connectedUsersArray[connectedUsersArray.length-1];
        userId = 'u' + (parseInt(element.replace("u", ""))+1);
    }
    else {
        userId = "u0";
    }
    console.log('a user connected: '+userId);
    io.emit('user connect', userId);
    connectedUsersArray.push(userId);
    console.log('Number of Users Connected ' + connectedUsersArray.length);
    console.log('User(s) Connected: ' + connectedUsersArray);
    io.emit('connected users', connectedUsersArray);
    
    socket.on('user disconnect', function(msg) {
        console.log('remove: ' + msg);
        connectedUsersArray.splice(connectedUsersArray.lastIndexOf(msg), 1);
        io.emit('user disconnect', msg);
    });
    
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        console.log('message: ' + msg.value);
    });
    
    socket.on('toogle led', function(msg) {
        myOnboardLed.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
        msg.value = ledState;
        io.emit('toogle led', msg);
        ledState = !ledState; //invert the ledState
    });
    
});

http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});

// Reading Sensor Values

var photoResistor = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)
var highSensitiveVoiceSensor = new mraa.Aio(1); //setup access analog input Analog pin #1 (A1)

var shockSwitchSensor = new mraa.Gpio(8); //setup access analog input Analog pin #2 (A2)
shockSwitchSensor.dir(mraa.DIR_IN); //set the gpio direction to input

var knockSensor = new mraa.Gpio(7); //setup access analog input Analog pin #2 (A2)
knockSensor.dir(mraa.DIR_IN);
//var microSensor = new mraa.Aio(0); //setup access analog input Analog pin #4 (A4)


function getSensors() {
	
	var lightValue = photoResistor.readFloat(); //read the value of the analog pin
    console.log("Light: ", lightValue); //write the value of the analog pin to the console

    var     highSensitiveVoiceValue = highSensitiveVoiceSensor.readFloat(); //read the value of the analog pin
    console.log("highSens: ", highSensitiveVoiceValue); //write the value of the analog pin to the console

    //var microSensorValue = microSensor.read(); //read the value of the analog pin
    //console.log("Micro: ", microSensorValue); //write the value of the analog pin to the console

    var shockSwitchValue = shockSwitchSensor.read(); //read the value of the analog pin
    console.log("Shock: ", shockSwitchValue); //write the value of the analog pin to the console

    var knockSensorValue = knockSensor.read(); //read the value of the analog pin
    console.log("Knock: ", knockSensorValue); //write the value of the analog pin to the console

    io.emit('lightValue', lightValue);
    io.emit('highSensitiveVoiceValue', highSensitiveVoiceValue);
    io.emit('shockSwitchValue', shockSwitchValue);
    io.emit('knockSensorValue', knockSensorValue);
    //io.emit('microSensorValue', microSensorValue);
    setTimeout(getSensors, 500);
}
getSensors();