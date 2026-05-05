# SignalK Raspberry Pi BMP085 Plugin

A SignalK node server plugin that reads temperature and barometric pressure data from a BMP085 sensor on a Raspberry Pi using I2C.

## Installation

This plugin requires the `bmp085` NPM package to communicate with the hardware sensor.

To install the required dependency, run the following command in the plugin directory:

```bash
npm install bmp085
```

> **Note:** You must have I2C enabled on your Raspberry Pi.

## Status

> **Warning:** This plugin is currently **untested** on actual hardware. It has been refactored from a similar BME280 plugin, but has not been verified on a live BMP085 sensor. Use at your own risk and please test before relying on it in a production environment.

## SignalK Delta Messages

The plugin will send delta messages to the SignalK server at the specified update rate:
- **Temperature:** Measured in Celsius, converted and sent as Kelvin.
- **Pressure:** Measured in hPa, converted and sent as Pascal.

## Configuration

You can configure the following settings via the SignalK Plugin Configuration interface:
- **Sample Rate (in seconds):** How often to read from the sensor.
- **SignalK Path:** The path under `environment.` (e.g. `inside.salon`).
- **I2C Bus Number:** The I2C bus device number (default is `1` for `/dev/i2c-1`).
- **I2C Address:** The I2C address of your BMP085 sensor (default is `0x77`).
