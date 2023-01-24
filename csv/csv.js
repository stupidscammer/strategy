const { convertArrayToCSV } = require("convert-array-to-csv");
const converter = require("convert-array-to-csv");
const fs = require("fs");
const csv = require("csv-parser");
const fastCsv = require("fast-csv");

const { Console } = require("console");
const header = [
  "Kline open time",
  "Open price",
  "High price",
  "Low price",
  "Close price",
  "Volume",
  "Kline Close time",
  "Quote asset volume",
  "Number of trades",
  "Taker buy base asset volume",
  "Taker buy quote asset volume",
  "Unused field, ignore",
];
var isHeader = false;
//This function is to import prices to csv file.
function exportCSV(path, priceArray) {
  for (let i = 0; i < 20; i++) {
    var valDate = new Date(priceArray[i][0]);
    let month = valDate.getMonth();
    let year = valDate.getYear();
    year %= 100;
    let textDate =
      valDate.getDate().toString() + String(month + 1) + String(year) + "_";
    let varHour;
    if (valDate.getHours() < 10) {
      varHour = "0" + valDate.getHours().toString();
    } else {
      varHour = valDate.getHours().toString();
    }
    textDate += varHour;
    let varMinutes;
    if (valDate.getMinutes() < 10) {
      varMinutes = "0" + valDate.getMinutes().toString();
    } else {
      varMinutes = valDate.getMinutes().toString();
    }
    textDate += varMinutes;
    priceArray[i][0] = textDate;

    valDate = new Date(priceArray[i][6]);
    let monthVal = valDate.getMonth();
    monthVal += 1;

    let yearVal = valDate.getYear();
    yearVal %= 100;
    textDate =
      valDate.getDate().toString() + String(monthVal) + String(yearVal) + "_";
    if (valDate.getHours() < 10) {
      varHour = "0" + valDate.getHours().toString();
    } else {
      varHour = valDate.getHours().toString();
    }
    textDate += varHour;
    if (valDate.getMinutes() < 10) {
      varMinutes = "0" + valDate.getMinutes().toString();
    } else {
      varMinutes = valDate.getMinutes().toString();
    }
    textDate += varMinutes;
    priceArray[i][6] = textDate;
  }

  var val;
  if (!isHeader) {
    //print the prices with header to csv file
    val = convertArrayToCSV(priceArray, {
      header,
      separator: ",",
    });
  } else {
    //print the prices to csv file
    val = convertArrayToCSV([priceArray[19]], {
      separator: ",",
    });
  }
  isHeader = true;

  //this part is for export data to csv file.
  fs.appendFile(path, val, (err) => {
    if (err) {
      console.log("CSV file has not been saved.");
    }
  });
}

const loadStrategies = (filename) => {
  return new Promise((resolve) => {
    const data = [];
    fs.createReadStream(filename)
      .pipe(fastCsv.parse({ headers: true, delimiter: "," }))
      .on("error", (error) => console.error(error))
      .on("data", (row) => data.push(row))
      .on("end", () => {
        resolve(data);
      });
  });
};

const importCSV = (filePath) => {
  return new Promise((resolve) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(fastCsv.parse({ headers: true, delimiter: "," }))
      .on("error", (error) => console.error(error))
      .on("data", (row) => data.push(row))
      .on("end", () => {
        resolve(data);
      });
  });
};

module.exports = { importCSV, exportCSV, loadStrategies };
