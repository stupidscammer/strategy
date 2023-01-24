const assert = require("assert");
var { Strategy, analyzeTicks } = require("../strategy.js");
const { sampleTicks } = require("./data.js");

describe("Strategy", () => {
  it("analyzeTicks", () => {
    const result = analyzeTicks(sampleTicks);
    assert.equal(result.lowPriceBefore10, 1271.68);
    assert.equal(result.lowPriceBefore20, 1280.31);
    assert.equal(result.shouldBuy, false);
  });
});

describe("Class Strategy", () => {
  const csvData = {
    strategy_id: "MIN-2-4-6-8-10-12-14-16-18-20-SL--0,006-0,0017-0,02",
    strategy_type_buy: "MIN",
    n1: "2",
    n2: "4",
    n3: "6",
    n4: "8",
    n5: "10",
    n6: "12",
    n7: "14",
    n8: "16",
    n9: "18",
    n10: "20",
    strategy_type_sell: "SL",
    SL_minus: "-0,60%",
    SL_plus: "0,50%",
    SL_zero: "0,0017",
    SL_floating: "2%",
    start_date_time: "01.01.2018 0:00",
    end_date_time: "2018-01-01 00:59",
  };

  it("creation", () => {
    const strat = new Strategy(csvData);
    assert.equal(strat.limit, 20);
    // assert.equal(strat.startDateTime, 20);
    // assert.equal(strat.endDateTime, 20);

    assert.equal(strat.stopLossZero, 0.0017);
    assert.equal(strat.stopLossMinus, -0.6);
    assert.equal(strat.stopLossPlus, 0.5);
    assert.equal(strat.stopLossFloating, 2);
  });

  it("analyzes Ticks", () => {
    const strat = new Strategy(csvData);
    const result = strat.shouldBuy(sampleTicks);

    assert.equal(result, false);
  });

  it("filename", () => {
    const strat = new Strategy(csvData);

    assert.equal(
      strat.getDataFilename(),
      "2018-01-01T08-00-00Z2018-01-01T08-59-00Z.csv"
    );
  });
});
