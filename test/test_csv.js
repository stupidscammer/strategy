const { loadStrategies } = require("../csv/csv");
const assert = require("assert");

describe("csv utilities", () => {
  it("correctly loads file", async () => {
    const data = await loadStrategies("./strategies.csv");

    assert.equal(
      data[0].strategy_id,
      "MIN-8-16-34-52-70-78-96-124-132-160-SL--0,006+0,005-0,0017-0,02"
    );
  });
});
