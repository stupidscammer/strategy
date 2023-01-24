const Binance = require("node-binance-api-testnet");
var { exportCSV } = require("./csv/csv.js");
var {
  exportLog,
  logShouldBuy,
  logShouldNotBuy,
  logBalances,
  logBuying,
  logSelling,
  logNotSelling,
  exportLogAndConsole,
} = require("./binancelog/log.js");
var {
  exportBuyingPrice,
  importFormattedBuyingPrice,
} = require("./price/price.js");

var { analyzeTicks } = require("./strategy.js");

const binance = new Binance().options({
  APIKEY: "DUifGMvf8yYTS3EKMHtqKzPTlWJIkH8Kbafe48r1N6jPvBhZPx05fzT5WX5yBp1P",
  APISECRET: "1g72ow4pe2m9xyNDgg3w1cd6PTtaCj4HpIYCq9stFBNS4GYDecUcVxhjQpG2pECs",
});

let status = 1;
let price = 0;
let mprice = 0;

let csvPath = "./csv/csv-log/";
let logPath = "./binancelog/binance-log/";

let currentDate = new Date();
let year = currentDate.getYear();
year %= 100;

let month = currentDate.getMonth();
month += 1;

let textDate =
  currentDate.getDate().toString() + String(month) + String(year) + "_";
let varHour;
if (currentDate.getHours() < 10) {
  varHour = "0" + currentDate.getHours().toString();
} else {
  varHour = currentDate.getHours().toString();
}
textDate += varHour;

let varMinutes;
if (currentDate.getMinutes() < 10) {
  varMinutes = "0" + currentDate.getMinutes().toString();
} else {
  varMinutes = currentDate.getMinutes().toString();
}
textDate += varMinutes;
//get the csv and log file paths
let csvRealPath = csvPath + textDate + ".csv";
let logRealPath = logPath + textDate + ".log";
const tradeSell = async () => {
  if (status == 0) {
    let current = Date.now();
    binance.candlesticks(
      "ETHUSDT",
      "1m",
      async (error, ticks, symbol) => {
        const analysis = analyzeTicks(ticks);

        (async () => {
          await exportCSV(csvRealPath, ticks);
        })();

        if (analysis.shouldBuy) {
          logShouldBuy(logRealPath, analysis);

          binance.balance(async (error, balances) => {
            if (balances.USDT !== undefined && balances.USDT.available > 10) {
              //calculate the balances for buying
              logBuying(logRealPath, balances);
              let ticker = await binance.prices();
              price = ticker.ETHUSDT;
              mprice = 0;
              //This part is for buying
              try {
                let temp = Number(balances.USDT.available);
                temp /= price;
                temp *= 0.99;
                quantity = temp.toFixed(4);
                if (quantity > temp) {
                  quantity -= 0.0001;
                  quantity = quantity.toFixed(4);
                }
                exportBuyingPrice(price);

                await exportLogAndConsole(
                  logRealPath,
                  "\nBuying quantity " + quantity
                );

                await binance.marketBuy("ETHUSDT", parseFloat(quantity, 10));
              } catch (e) {
                console.error(e);
              }

              logBalances(logRealPath, balances);
              status = 1;
            }
          });
        } else {
          //get balances & print that time is not for buying.
          //Also get the low prices and close prices before 20, before 10, now
          binance.balance(async (error, balances) => {
            logShouldNotBuy(logRealPath, analysis, balances);
          });
        }
      },
      { limit: 21, endTime: current }
    );
  } else {
    // We still export prices every minute
    let currentTime = Date.now();
    binance.candlesticks(
      "ETHUSDT",
      "1m",
      async (error, ticks, symbol) => {
        //exports prices into the csv file
        await exportCSV(csvRealPath, ticks);
      },
      { limit: 21, endTime: currentTime }
    );
  }
};

const tradeBuy = async () => {
  if (status == 1) {
    //get the current price
    let ticker = await binance.prices();
    let cprice = ticker.ETHUSDT;
    if (price == 0) {
      price = cprice;
    }

    //if selling time according to your strategy
    if (
      cprice < price * 0.999 ||
      (mprice > price * 1.007 && cprice <= price * 1.007) ||
      price < mprice * 0.985
    ) {
      logSelling(logRealPath, price, cprice, mprice);

      binance.balance(async (error, balances) => {
        //get the balances, print them & sell in this part.

        if (balances.ETH !== undefined && balances.ETH.available > 0.009) {
          await exportLogAndConsole(logRealPath, "\n-------Sellling-------");
          await exportLogAndConsole(logRealPath, "\nBefore:ETHs balances:");
          await exportLogAndConsole(
            logRealPath,
            String(balances.ETH.available)
          );
          await exportLogAndConsole(logRealPath, "\nBefore:USDTs balances:");
          await exportLogAndConsole(
            logRealPath,
            String(balances.USDT.available)
          );
          try {
            let temp = Number(balances.ETH.available);
            quantity = temp.toFixed(4);
            if (quantity > temp) {
              quantity -= 0.0001;
              quantity = quantity.toFixed(4);
            }
            //using this function eths are selled
            await binance.marketSell("ETHUSDT", quantity);
          } catch (e) {
            console.error(e);
          }
          status = 0;
        } else {
          if (balances.ETH && balances.ETH.available <= 0.009) {
            await exportLogAndConsole(
              logRealPath,
              "\nSwitching to buying mode as only ETH available: " +
                String(balances.ETH.available)
            );

            status = 0;
          }
        }
      });
    } else {
      //get balances & print that is not the time for selling.
      binance.balance(async (error, balances) => {
        logNotSelling(logRealPath, price, cprice, balances);
      });
    }
  }
};

//this function is to get the highest price and save it to 'mprice' value
const getHighestPrice = async () => {
  let ticker = await binance.prices();
  mprice = mprice > ticker.ETHUSDT ? mprice : ticker.ETHUSDT;
};

//this is the main function
const main = async () => {
  try {
    price = await importFormattedBuyingPrice();
  } catch (error) {
    console.error(error);
  }
  binance.balance(async (error, balances) => {
    if (balances.ETH !== undefined && balances.ETH.available > 0) {
      status = 1;
    }
  });
  //every minute trade function is called
  setInterval(tradeBuy, 60000);
  setInterval(tradeSell, 5000);
  //every second this function is called to get the max price according to your strategy.
  setInterval(getHighestPrice, 1000);
};
main();
