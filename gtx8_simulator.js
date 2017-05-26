// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// the  original version of this modified can be found @ https://github.com/Azure/azure-iot-sdk-node/blob/master/device/samples/remote_monitoring.js

'use strict';

var Protocol = require('azure-iot-device-http').Http;
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
var connectionString = 'HostName=myiotlab.azure-devices.net;DeviceId=TSR04;SharedAccessKey=bHrDNrLY1hJ2KS80000000000000000M=';

var deviceId = ConnectionString.parse(connectionString).DeviceId;

// Driver Data
var employeeID = "5-1590";

function getEmployeeID(){
   return employeeID;
}

// Sensors data
var temperature = 50;
var humidity = 50;
var externalTemperature = 55;
var timestampData = new Date().toISOString();

//location
var locLongitude = 100.547784;
var locLatitude =  13.739479;

function getLocLongtitude(){
   return locLongitude;
}

function getLocLatitude(){
   return locLatitude;
}

// Create IoT Hub client
var client = Client.fromConnectionString(connectionString, Protocol);

// Helper function to print results for an operation
function printErrorFor(op) {
  return function printError(err) {
    if (err) console.log(op + ' error: ' + err.toString());
  };
}

// Helper function to generate random number between min and max
function generateRandomIncrement() {
  return ((Math.random() * 2) - 1);
}

// Send device meta data
var deviceMetaData = {
  'ObjectType': 'DeviceInfo',
  'IsSimulatedDevice': 0,
  'Version': '1.0',
  'DeviceProperties': {
    'DeviceID': deviceId,
    'HubEnabledState': 1,
    'CreatedTime': '2016-09-21T20:28:55.5448990Z',
    'DeviceState': 'normal',
    'UpdatedTime': null,
    'Manufacturer': 'Transcode.',
    'ModelNumber': 'MD-909',
    'SerialNumber': 'SER9090',
    'FirmwareVersion': '1.10',
    'Platform': 'node.js',
    'Processor': 'ARM',
    'InstalledRAM': '64 MB',
    'Latitude': 13.739479,
    'Longitude': 100.547784
  },
  'Commands': [{
    'Name': 'SetTemperature',
    'Parameters': [{
      'Name': 'Temperature',
      'Type': 'double'
    }]
  },
    {
      'Name': 'SetHumidity',
      'Parameters': [{
        'Name': 'Humidity',
        'Type': 'double'
      }]
    }]
};

client.open(function (err, result) {
  if (err) {
    printErrorFor('open')(err);
  } else {
    console.log('Sending device metadata:\n' + JSON.stringify(deviceMetaData));
    client.sendEvent(new Message(JSON.stringify(deviceMetaData)), printErrorFor('send metadata'));

    client.on('message', function (msg) {
      console.log('receive data: ' + msg.getData());

      try {
        var command = JSON.parse(msg.getData());
        if (command.Name === 'SetTemperature') {
          temperature = command.Parameters.Temperature;
          console.log('New temperature set to :' + temperature + 'F');
        }

        client.complete(msg, printErrorFor('complete'));
      }
      catch (err) {
        printErrorFor('parse received message')(err);
        client.reject(msg, printErrorFor('reject'));
      }
    });

    // start event data send routing
    var sendInterval = setInterval(function () {
      temperature += generateRandomIncrement();
      externalTemperature += generateRandomIncrement();
      locLongitude=getLocLongtitude();
      locLatitude=getLocLatitude()+0.0002;
      humidity += generateRandomIncrement();
      timestampData = new Date().toISOString();
	  employeeID=getEmployeeID();

      var data = JSON.stringify({
        'DeviceID': deviceId,
        'Temperature': temperature,
        'Humidity': humidity,
        'TimestampData': timestampData,
		    "gps" : {
			    "loc" : {
                    "type" : "Point",
                    "coordinates" : [ 
                        locLongitude, 
                        locLatitude
                    ]
                  },
                  "speed" : null,
                  "rpm" : null,
                  "fuel" : null,
                  "enstat" : null,
                  "acc" : null,
                  "km" : null,
                  "heading" : null,
                  "meter" : {
                    "stat" : null,
                    "fare" : null,
                    "dist" : null,
                    "time" : null
                  }
                },
      "driver" : {
      "employee_id" : employeeID
      },
        'ExternalTemperature': externalTemperature
      });

      console.log('Sending device event data:\n' + data);
      client.sendEvent(new Message(data), printErrorFor('send event'));
    }, 1000);

    client.on('error', function (err) {
      printErrorFor('client')(err);
      if (sendInterval) clearInterval(sendInterval);
      client.close();
    });
  }
});
