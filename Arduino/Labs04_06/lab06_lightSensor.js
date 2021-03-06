/* Lab06_lightSensor
 * In this lab you will create an ambient light sensor that sends
 * telemetry to the service once per second. This device is a read-only 
 * device and doesn't accept any command. 
 *
 * Wire up an ambient light sensor like the one in Lab 04.
 */
 var five = require ("johnny-five"),
    board, photoresistor;
    
var Store = require("nitrogen-file-store"),
    nitrogen = require("nitrogen"),
    service, lightSensor;

var config = {
    host: process.env.HOST_NAME || 'api.nitrogen.io',
    http_port: process.env.PORT || 443,
    protocol: process.env.PROTOCOL || 'https',
    api_key: process.env.API_KEY || 'YOUR API KEY HERE'
};

board = new five.Board({ port: "COM5" });
config.store = new Store(config);
service = new nitrogen.Service(config);

// Create a new Nitrogen device for the photoresistor
// This device will send data it reads from a sensor
lightSensor = new nitrogen.Device({
    nickname: 'lab06_lightSensor',
    name: 'Lab 06 Light Sensor',
    tags: ['sends:_lightLevel']
});

// Connect the lightSensor device defined above
// to the Nitrogen service instance.
service.connect(lightSensor, function(err, session, lightSensor) {
    if (err) { return console.log('Failed to connect lightSensor: ' + err); }
    
    board.on("ready", function() {
        console.log("Board connected...");
    
        // Create a new `photoresistor` hardware instance.
        photoresistor = new five.Sensor({
            pin: 'A0',  // Analog pin 0
            freq: 1000  // Collect data once per second
        });

        // Inject the `sensor` hardware into the Repl instance's context;
        // Allows direct command line access
        board.repl.inject({
            pot: photoresistor
        });
        
        // Define the event handler for the photo resistor reading
        // The freq value used when the photoresistor was defined
        // determines how often this is invoked, thus controlling
        // the frequency of Nitrogen messages.
        photoresistor.on('data', function() {
            // Capture the ambient light level from the photo resistor
            var lightLevel = this.value;
            
            // Create a Nitrogen Message to send the _lightLevel
            var ambientLightMessage = new nitrogen.Message({
                type: '_lightLevel',
                // Specify a command tag that you can scope to
                // This will enable you to filter out non-relevant messages
                tags: nitrogen.CommandManager.commandTag('lab06'),
                body: {
                    command: {
                        ambientLight: lightLevel
                    }
                }
            });
            
            // Send the message
            ambientLightMessage.send(session);
            // Show the message in the console
            console.log("Message sent: " + JSON.stringify(ambientLightMessage));
        });
    });
});