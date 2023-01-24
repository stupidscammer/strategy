const fs = require("fs");
const { Console } = require("console");
const { resolve } = require("path");
const path = "./price/price.log";
async function exportBuyingPrice(price) {
  //Generate Id 10-numbers random
  let idNumber = String(Math.random() * 10000000000);
  let temp = idNumber.toString();
  let id = temp.split(".");
  let idRealNumber = "\n" + id[0] + ":" + price;
  //Record the final buying price
  try {
    await fs.promises.appendFile(path, idRealNumber);
  } catch (err) {
    console.log("The price has been saved.");
  }
}

async function importBuyingPrice() {
  //Get the last buying price
  try {
    return await fs.promises.readFile(path, (err, inputD) => {});
  } catch (err) {
    console.log("Geting the last buying price failed.");
  }
}

async function importFormattedBuyingPrice() {
  let temp = await importBuyingPrice();
  let inputData = temp.toString();
  var lines = inputData.split("\n");
  var lastLine = lines[lines.length - 1].length
    ? lines[lines.length - 1]
    : lines[lines.length - 2];
  let priceTemp = lastLine.split(":");
  return Number(priceTemp[1]);
}

module.exports = {
  importBuyingPrice,
  exportBuyingPrice,
  importFormattedBuyingPrice,
};
