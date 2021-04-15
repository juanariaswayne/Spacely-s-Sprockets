import { Sensor } from "./interfaces/sensor.interface";

const allowedSensors = ["thermometer", "humidity", "monoxide"];
const variableTemperature = 1.5;
const variableHumidity = 1;
const variableMonxide = 3;

export function evaluateLogFile(logContentsStr: string): string {
  const stringArray = stringToArray(logContentsStr);
  const referencesArray = getReferencesArr(stringArray[0]).map(el => parseFloat(el));
  const sensors = getSensorsQuality(processLog(stringArray), referencesArray);
  return exportJson(sensors);
}

function exportJson(sensorsArr: Sensor[]) {
  let sensorObj: any;
  sensorsArr.forEach(sensor => {
    sensorObj = {...sensorObj, ...{[sensor.name] : sensor.quality}}
  });
  return JSON.stringify(sensorObj);
}

function processLog(logStr: string[]) {
  const sensors: Sensor[] = [];
  logStr.shift();
  let index = 0;
  logStr.map(value => {
    if (allowedSensors.some(sensor => value.includes(sensor))) {
      const sensorType = value.split(" ")[0].toString();
      const sensorName = value.split(" ")[1].toString();
      const sensorObj = { name: sensorName, type: sensorType, registerValues: [], standardDeviation: 0, quality: "" };
      if (sensors.length !== 0) {
        index++;
      }
      sensors.push(sensorObj);
    } else {
      const registerDate = value.split(" ")[0];
      const registerValue = parseFloat(value.split(" ")[1]);
      sensors[index].registerValues.push(registerValue);
    }
  });
  return sensors;
}

function getSensorsQuality(sensorsArr: Sensor[], referencesArray: number[]): Sensor[] {
  sensorsArr.map(sensor => {
    sensor.standardDeviation = getStandardDev(sensor.registerValues);
    switch (sensor.type) {
      case "thermometer":
        sensor.quality = testThermometer(referencesArray[0], sensor.registerValues, sensor.standardDeviation);
        break;
      case "humidity":
        sensor.quality = testHumidity(referencesArray[1], sensor.registerValues);
        break;
      case "monoxide":
        sensor.quality = testMonoxide(referencesArray[2], sensor.registerValues);
        break;
    }
  });
  return sensorsArr;
}

function getReferencesArr(refStr: string): string[] {
  return refStr.trim().replace("reference", "").trim().split(" ");
}

function stringToArray(log: string): string[] {
  return log.trim().split(/\s*[\r\n]+\s*/g);
}

function getStandardDev(values: number[]) {
  var avg = average(values);

  var squareDiffs = values.map(function(value) {
    var diff = value - avg;
    return diff * diff;
  });

  var avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

function average(data: any[]) {
  var sum = data.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  return sum / data.length;
}

function readLargeLogsPartial(logStr: string, index: number, chars: number): string {
  return logStr.substr(index, chars);
}

function testThermometer(referenceTemp: number, tempRegister: number[], standardDev: number): string {
  const lessThanO5 = tempRegister.every((temp) => Math.abs(temp - referenceTemp) <= variableTemperature);
  if (lessThanO5 && standardDev < 3) {
    return "ultra precise";
  } else if (lessThanO5 && standardDev < 3) {
    return "very precise";
  } else {
    return "precise";
  }
}

function testHumidity(referenceHumidity: number, values: number[]): string {
  const lessThan1Percent = values.every(val => Math.abs(val - referenceHumidity) <= variableHumidity);
  if (lessThan1Percent) {
    return "keep";
  } else {
    return "discard";
  }
}

function testMonoxide(referenceMonoxide: number, values: number[]): string {
  const lessThan3 = values.every(val => Math.abs(val - referenceMonoxide) <= variableMonxide);
  if (lessThan3) {
    return "keep";
  } else {
    return "discard";
  }
}
