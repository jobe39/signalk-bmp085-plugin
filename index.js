/*
 * SignalK node server plugin that reads data from a BMP085/BMP180 temperature/barometer sensor on Raspberry-Pi
 * Refactored from bme280 version
 */

const bmp180 = require('bmp180-sensor');

module.exports = function (app) {
  let timer = null;
  let plugin = {};
  let sensor = null;

  plugin.id = 'signalk-raspberry-pi-bmp085';
  plugin.name = 'Raspberry-Pi BMP085/BMP180';
  plugin.description = 'BMP085/BMP180 temperature & pressure sensor on Raspberry-Pi';

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
        description: 'This is used to build the path in Signal K. It will be appended to \'environment\'',
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

    function createDeltaMessage(temperature, pressure) {
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

    async function initAndRun() {
      try {
        sensor = await bmp180({
          address: Number(options.i2c_address || '0x77'),
          bus: Number(options.i2c_bus || 1),
          mode: 3
        });
        console.log('BMP180/085 initialization succeeded');
      } catch (err) {
        console.error('BMP180/085 initialization failed:', err);
        return;
      }

      async function readSensorData() {
        if (!sensor) return;
        try {
          const data = await sensor.read();
          if (data !== null && data.temperature !== undefined) {
            // data.temperature is in C, data.pressure is in Pa for bmp180-sensor
            // SignalK requires temperature in Kelvin and pressure in Pascal
            const temperature = data.temperature + 273.15;
            const pressure = data.pressure; 

            var delta = createDeltaMessage(temperature, pressure);
            app.handleMessage(plugin.id, delta);
          } else {
            console.log(`BMP180/085 read error or null data`);
          }
        } catch (err) {
          console.error(`BMP180/085 read error:`, err);
        }
      }

      readSensorData();
      timer = setInterval(readSensorData, options.rate * 1000);
    }

    initAndRun();
  };

  plugin.stop = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (sensor) {
      sensor.close().catch(e => console.error('Error closing sensor', e));
      sensor = null;
    }
  };

  return plugin;
};
