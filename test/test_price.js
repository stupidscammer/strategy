var {
  exportBuyingPrice,
  importBuyingPrice,
  importFormattedBuyingPrice,
} = require("../price/price.js");
const assert = require("assert");

describe("test price", () => {
  it("exporting works correctly", async () => {
    exportBuyingPrice(76.214442143);

    let temp = await importBuyingPrice();
    let inputData = temp.toString();
    var lines = inputData.split("\n");
    var lastLine = lines[lines.length - 1].length
      ? lines[lines.length - 1]
      : lines[lines.length - 2];
    let priceTemp = lastLine.split(":");
    let price = Number(priceTemp[1]);

    assert.equal(price, 76.214442143);
  });

  it("exporting works correctly", async () => {
    exportBuyingPrice(9867.213213);

    let price = await importFormattedBuyingPrice();

    assert.equal(price, 9867.213213);
  });
});
