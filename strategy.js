const low = (row) => {
  return row[3];
};

const close = (row) => {
  return row[4];
};

const analyzeTicks = (ticks) => {
  const lowPriceBefore10 = Math.min(...ticks.slice(10, 20).map(low));
  const lowPriceBefore20 = Math.min(...ticks.slice(0, 10).map(low));

  const lowPrice1MinuteAgo = low(ticks[19]);

  const closePrice1MinuteAgo = close(ticks[19]);
  const closePrice10MinuteAgo = close(ticks[10]);
  const closePrice20MinuteAgo = close(ticks[0]);

  const shouldBuy =
    lowPriceBefore20 < lowPriceBefore10 &&
    lowPriceBefore10 < lowPrice1MinuteAgo &&
    closePrice20MinuteAgo < closePrice10MinuteAgo &&
    closePrice10MinuteAgo < closePrice1MinuteAgo;

  return {
    lowPriceBefore10,
    lowPriceBefore20,
    lowPrice1MinuteAgo,
    closePrice1MinuteAgo,
    closePrice10MinuteAgo,
    closePrice20MinuteAgo,
    shouldBuy,
  };
};

const parseValue = (val) => {
  return parseFloat(val.replace("%", "").replace(",", "."), 10);
};

class Strategy {
  constructor(csvData) {
    this.limits = [];

    for (let j = 1; j <= 10; j++) {
      this.limits.push(parseInt(csvData["n" + j], 10));
    }
    this.limit = Math.max(...this.limits);

    this.buy_type = csvData.strategy_type_buy;
    this.sell_type = csvData.strategy_type_sell;

    if (this.buy_type === "MIN") {
      this.buyArrayFunction = (arr) => {
        return Math.min(...arr);
      };
    } else if (this.buy_type === "SMA") {
      this.buyArrayFunction = (arr) => {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      };
    } else {
      throw "Unsupported buy type";
    }

    this.startDateTime = new Date(csvData.start_date_time);
    this.endDateTime = new Date(csvData.end_date_time);

    this.stopLossZero = parseValue(csvData["SL_zero"]);
    this.stopLossMinus = parseValue(csvData["SL_minus"]);
    this.stopLossPlus = parseValue(csvData["SL_plus"]);
    this.stopLossFloating = parseValue(csvData["SL_floating"]);

    this.reason = "";
    this.index=0;
    this.sindex=0;
    this.numLossMinus = 0;
    this.numLossPlus = 0;
    this.numLossFloating = 0;

    this.id = csvData["strategy_id"];
  }
  getIndex(){
    return this.index;
  }
  getSindex(){//SellID 1,2,3
    return this.sindex;
  }
  shouldBuy(ticks) {
    this.reason = "";
    for (let j = 1; j < this.limits.length - 1; j++) {
      let l1 = this.buyArrayFunction(
        ticks.slice(this.limits[j - 1], this.limits[j]).map(low)
      );
      let l2 = this.buyArrayFunction(
        ticks.slice(this.limits[j], this.limits[j + 1]).map(low)
      );
      let c1 = this.buyArrayFunction(
        ticks.slice(this.limits[j - 1], this.limits[j]).map(close)
      );
      let c2 = this.buyArrayFunction(
        ticks.slice(this.limits[j], this.limits[j + 1]).map(close)
      );

      if((l1<l2)&&(c1<c2)){
        this.index=j;
        this.reason = "Buying";
        this.buyPrice = close(ticks[0]);
        this.maximalPrice = close(ticks[0]);
        return true;
      }
    }
    this.reason = "Fails condition n" ;
    return false;
  }

  shouldSell(ticks) {
    this.reason = "";
    const currentPrice = close(ticks[0]);
    if (currentPrice > this.maximalPrice) {
      this.maximalPrice = currentPrice;
      // console.log("New maximal price ", currentPrice);
    }

    const stopLossZeroPrice = this.buyPrice + this.stopLossZero;
    const stopLossMinusPrice =
      (this.buyPrice * (100 + this.stopLossMinus)) / 100;
    const stopLossPlusPrice = (this.buyPrice * (100 + this.stopLossPlus)) / 100;
    const minimalFloatingPrice =
      (this.buyPrice * (100 + this.stopLossFloating)) / 100;

    const sellFloatingPrice =
      (this.maximalPrice * (100 - this.stopLossFloating)) / 100;

    // if (currentPrice > stopLossZeroPrice) {
    //   this.reason =
    //     "Selling due to Stop Loss Zero: " +
    //     currentPrice +
    //     " > " +
    //     stopLossZeroPrice;
    //   return true;
    // }

    if (currentPrice < stopLossMinusPrice) {
      this.reason =
        "Selling due to Stop Loss Minus: " +
        currentPrice +
        " < " +
        stopLossMinusPrice;
      this.numLossMinus += 1;
      this.sindex=1;
      return true;
    }

    if (this.maximalPrice > minimalFloatingPrice) {
      if (currentPrice < sellFloatingPrice) {
        this.reason =
          "Selling due to Floating Stop Loss: " +
          currentPrice +
          " < " +
          sellFloatingPrice +
          " and " +
          this.maximalPrice +
          " > " +
          minimalFloatingPrice;
        this.numLossFloating += 1;
        this.sindex=3;
        return true;
      }
    } else if (
      this.maximalPrice > stopLossPlusPrice &&
      currentPrice < stopLossPlusPrice
    ) {
      this.reason =
        "Selling due to Stop Loss Plus: " +
        currentPrice +
        " < " +
        stopLossPlusPrice;
        this.sindex=2;
      this.numLossPlus += 1;
      return true;
    }

    this.reason = "Hold";

    return false;
  }

  getDataFilename() {
    let filename =
      this.startDateTime.toISOString() + this.endDateTime.toISOString();
    while (filename.indexOf(":") > -1) {
      filename = filename.replace(":", "-");
    }
    filename = filename.replace(".000", "");
    filename = filename.replace(".000", "");

    return filename + ".csv";
  }

  getResult() {
    return {
      id: this.id,
      startDat: this.startDateTime,
      endDate: this.endDateTime,
      numberOfSellsSLFloating: this.numLossFloating,
      numberOfSellsSLPlus: this.numLossPlus,
      numberOfSellsSLMinus: this.numLossMinus,
    };
  }
}

module.exports = {
  analyzeTicks,
  Strategy,
};
