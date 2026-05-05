/*
 * SignalK node server plugin that reads data from a BMP085 temperature/barometer sensor on Raspberry-Pi
 * Refactored from bme280 version
 */

const BMP085 = require('bmp085');

module.exports = function (app) {
  let timer = null;
  let plugin = {};

  plugin.id = 'signalk-raspberry-pi-bmp085';
  plugin.name = 'Raspberry-Pi BMP085';
  plugin.description = 'BMP085 temperature & pressure sensor on Raspberry-Pi';

  plugin.schema = {
    type: 'object',
    properties: {
      rate: {
        title: "Sample Rate (in seconds)",
        type: 'number',
        default: 60
      },
      path: {
        type: 'string',
        title: 'SignalK Path',
        description: 'This is used to build the path in Signal K. It will be appended to \\'environment\\'',
        default: 'inside.salon'
      },
      i2c_bus: {
        type: 'integer',
        title: 'I2C bus number',
        default: 1,
      },
      i2c_address: {
        type: 'string',
        title: 'I2C address',
        default: '0x77',
      },
    }
  };

  plugin.start = function (options) {

    function createDeltaMessage (temperature, pressure) {
      var values = [
        {
          'path': 'environment.' + options.path + '.temperature',
          'value': temperature
        }, {
          'path': 'environment.' + options.path + '.pressure',
          'value': pressure
        }
      ];

      return {
        'context': 'vessels.' + app.selfId,
        'updates': [
          {
            'source': {
              'label': plugin.id
            },
            'timestamp': (new Date()).toISOString(),
            'values': values
          }
        ]
      };
    }

    const bmpOptions = {
      address: Number(options.i2c_address || '0x77'),
      device: '/dev/i2c-' + (options.i2c_bus || 1),
      mode: 3
    };

    const barometer = new BMP085(bmpOptions);

    function readSensorData() {
      barometer.read(function (data) {
        if (data !== null) {
          // data.temperature is in C, data.pressure is in hPa
          // SignalK requires temperature in Kelvin and pressure in Pascal
          const temperature = data.temperature + 273.15;
          const pressure = data.pressure * 100;

          var delta = createDeltaMessage(temperature, pressure);
          app.handleMessage(plugin.id, delta);
        } else {
          console.log(`BMP085 read error or null data`);
        }
      });
    }

    console.log('BMP085 initialization succeeded');
    readSensorData();
    timer = setInterval(readSensorData, options.rate * 1000);
  };

  plugin.stop = function () {
    if(timer){
      clearInterval(timer);
      timer = null;
    }
  };

  return plugin;
};
