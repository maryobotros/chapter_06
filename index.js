// '/dev/tty.usbmodem14101'
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

var SerialPort = require('serialport');
const parsers = SerialPort.parsers;
const parser = new parsers.Readline({
  delimiter: '\r\n'
});

var serialport = new SerialPort('/dev/tty.usbmodem14101',{ 
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});

serialport.pipe(parser);

app.engine('ejs', require('ejs').__express);
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res){
    res.render('index');
});

serialport.on('open', function(){
    console.log('serial port opened');
});

io.on('connection', function(socket){
    console.log('socket.io connection');
    serialport.on('data', function(data){
        // console.log(data);
        data = data.toString();
        data = data.replace(/(\r\n|\n|\r)/gm,'');
        

        //Slicing the component identifier (i.e. A0, A1, BP)
        var dataKey = data.slice(0,2);
        // Slicing the string from index 2 to the end
        var dataString = data.slice(2);
        // Replacing new line at the end of each string with an empty string 
        dataString = dataString.replace(/(\r\n|\n|\r)/gm,'');
        console.log(data);
        
        // If the button s interacted with 
        if(dataKey === "BP"){
            // Split the two numbers from the button and put into array (i.e. ['3', '4'])
            var dataArray = dataString.split(",");
            console.log(dataArray);
            
            // Send array to a socket called "button-data"
            socket.emit("button-data", dataArray);
        } 
        // Else if one of the potentiometers is interacted with 
        else if(dataKey == "A0" || dataKey == "A1"){
            // Make an object to store the dataKey and dataString
            var dataObject = {
                dataKey: dataKey,
                dataString: dataString
            }
            console.log(dataObject);

            // Send object to a socket called "bar-data"
            socket.emit("bar-data", dataObject);
        } 
    });
    
    socket.on('disconnect', function(){
        console.log('disconnected');
    }); 
});

server.listen(3000, function(){
    console.log('listening on port 3000...');
});