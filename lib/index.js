"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateLogFile = void 0;
var allowedSensors = ["thermometer", "humidity", "monoxide"];
var variableTemperature = 1.5;
var variableHumidity = 1;
var variableMonxide = 3;
function evaluateLogFile(logContentsStr) {
    var stringArray = stringToArray(logContentsStr);
    var referencesArray = getReferencesArr(stringArray[0]).map(function (el) { return parseFloat(el); });
    var sensors = getSensorsQuality(processLog(stringArray), referencesArray);
    return exportJson(sensors);
}
exports.evaluateLogFile = evaluateLogFile;
function exportJson(sensorsArr) {
    var sensorObj;
    sensorsArr.forEach(function (sensor) {
        var _a;
        sensorObj = __assign(__assign({}, sensorObj), (_a = {}, _a[sensor.name] = sensor.quality, _a));
    });
    return JSON.stringify(sensorObj);
}
function processLog(logStr) {
    var sensors = [];
    logStr.shift();
    var index = 0;
    logStr.map(function (value) {
        if (allowedSensors.some(function (sensor) { return value.includes(sensor); })) {
            var sensorType = value.split(" ")[0].toString();
            var sensorName = value.split(" ")[1].toString();
            var sensorObj = { name: sensorName, type: sensorType, registerValues: [], standardDeviation: 0, quality: "" };
            if (sensors.length !== 0) {
                index++;
            }
            sensors.push(sensorObj);
        }
        else {
            var registerDate = value.split(" ")[0];
            var registerValue = parseFloat(value.split(" ")[1]);
            sensors[index].registerValues.push(registerValue);
        }
    });
    return sensors;
}
function getSensorsQuality(sensorsArr, referencesArray) {
    sensorsArr.map(function (sensor) {
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
function getReferencesArr(refStr) {
    return refStr.trim().replace("reference", "").trim().split(" ");
}
function stringToArray(log) {
    return log.trim().split(/\s*[\r\n]+\s*/g);
}
function getStandardDev(values) {
    var avg = average(values);
    var squareDiffs = values.map(function (value) {
        var diff = value - avg;
        return diff * diff;
    });
    var avgSquareDiff = average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}
function average(data) {
    var sum = data.reduce(function (sum, value) {
        return sum + value;
    }, 0);
    return sum / data.length;
}
function readLargeLogsPartial(logStr, index, chars) {
    return logStr.substr(index, chars);
}
function testThermometer(referenceTemp, tempRegister, standardDev) {
    var lessThanO5 = tempRegister.every(function (temp) { return Math.abs(temp - referenceTemp) <= variableTemperature; });
    if (lessThanO5 && standardDev < 3) {
        return "ultra precise";
    }
    else if (lessThanO5 && standardDev < 3) {
        return "very precise";
    }
    else {
        return "precise";
    }
}
function testHumidity(referenceHumidity, values) {
    var lessThan1Percent = values.every(function (val) { return Math.abs(val - referenceHumidity) <= variableHumidity; });
    if (lessThan1Percent) {
        return "keep";
    }
    else {
        return "discard";
    }
}
function testMonoxide(referenceMonoxide, values) {
    var lessThan3 = values.every(function (val) { return Math.abs(val - referenceMonoxide) <= variableMonxide; });
    if (lessThan3) {
        return "keep";
    }
    else {
        return "discard";
    }
}
