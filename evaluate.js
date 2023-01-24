const Binance = require("node-binance-api-testnet");
var { exportCSV, importCSV, loadStrategies } = require("./csv/csv.js");
const { convertArrayToCSV } = require("convert-array-to-csv");
const csv = require("fast-csv");
const { format } = require('@fast-csv/format');
const fileName = 'result.csv';
const fs = require("fs");
const csvFile = fs.createWriteStream(fileName);
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

let l_b_d, l_s_d, l_o_r, t_e_u, a_o_p_w, a_o_p_d;
let buy = 0, sell = 0, ndays = 1, pros = 0, currentMoney = 1000, tmp = 0, tmp1 = 0, l_t_b_t = 0, firstaction = 1, lastaction = 1, whataction = "", avg = 0, max = 0, min = 0;
const header = [
  "strategy_id",
  "start_date_time",
  "end_date_time",
  "start usdt",
  "do nothing usdt",
  "lower than buy times",
  "strategy buy qty",
  "strategy sell qty",
  "min",
  "max",
  "average",
  "buy",
  "sell",
  "average operations per day",
  "average operations per week",
  "last_buy_date",
  "last_sell_date",
  "last_op_rate",
  "total earnings usdt",
];




var { analyzeTicks, Strategy } = require("./strategy.js");


const { Stream } = require("stream");

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
let a=[],b=[];
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

const getTickData = async (time, number) => {
  return new Promise((resolve) => {
    binance.candlesticks(
      "ETHUSDT",
      "1m",
      (error, ticks, symbol) => {
        // ticks.reverse();
        ticks.toString().split('').reverse().join('');
        resolve(ticks);
      },
      { limit: number, endTime: time.getTime() }
    );
  });
};

const balances = {
  USD: 100,
  ETH: 0,
};

const handleTimeSlice = async (time, strategy) => {
  const data = await getTickData(time, strategy.limit);
  const filename = "strategyData/" + strategy.getDataFilename();
  // console.log("Starting report is stored in ",filename);
  exportCSV(filename, data);
  // console.log("Ending report is stored in ",filename);
};

const handleTimeSliceAnalyze = (time, data, strategy) => {
  // console.log("test point----",time,"-", data,"---", strategy)
  if (balances.USD > 10) {
    if (strategy.shouldBuy(data)) {
      const price = parseFloat(data[0][4], 10);
      // console.log("Buying at ", time, " at price ", price);
      l_b_d = time; buy++; l_o_r = price;
      balances.ETH = balances.USD / price;
      balances.USD = 0;
      tmp1 = currentMoney;
      
      // console.log('index==>>>',strategy.getIndex());
      a.push(strategy.getIndex());
      currentMoney = currentMoney / price;
      if (whataction == "") { firstaction = price; whataction = "Buying"; }
      if ((whataction == "Selling") && (firstaction != 1)) lastaction = price;
      // console.log(time);
    }
    else l_t_b_t++;
  } else if (balances.ETH > 0.001) {
    if (strategy.shouldSell(data)) {
      const price = parseFloat(data[0][4], 10);
      // console.log("Selling at ", time, " at price ", price);
      l_s_d = time; sell++; l_o_r = price;
      balances.USD = balances.ETH * price;
      balances.ETH = 0;
      tmp = currentMoney * price;
      pros = (tmp - tmp1) * 100 / tmp;
      if (pros > max) max = pros;
      else if (pros < min) min = pros;
      avg = avg + pros;
      currentMoney = tmp;
      b.push(strategy.getSindex());
      if (whataction == "") { firstaction = price; whataction = "Selling"; }
      if ((whataction == "Buying") && (firstaction != 1)) lastaction = price;
    }
  }

};

//this is the main function
const main = async () => {
  const strategies = await loadStrategies("./strategies.csv");
  for (let l in strategies) {
    let currentStrategy = new Strategy(strategies[l]);
    let filename = "strategyData/" + currentStrategy.getDataFilename();
    let currentTime = new Date(currentStrategy.startDateTime.getTime());
    const one_day = 1000 * 60 * 60 * 24;
    ndays = Math.ceil((new Date(currentStrategy.endDateTime).getTime() - new Date(currentStrategy.startDateTime).getTime()) / one_day);
    if (fs.existsSync(filename)) {
      console.log("Analizying data...");
      const data = await importCSV(filename);
      let j = 0;
      while (j + currentStrategy.limit + 1 < data.length) {
        currentTime.setTime(currentTime.getTime() + 60 * 1000);
        let ticks = data
          .slice(j, j + currentStrategy.limit + 1)
          .map((x) => Object.values(x));
        handleTimeSliceAnalyze(currentTime, ticks, currentStrategy);
        j += 1;
      }
    } else {
      console.log("Downloading data");
      while (currentTime < currentStrategy.endDateTime) {
        await handleTimeSlice(currentTime, currentStrategy);
        currentTime.setTime(currentTime.getTime() + 60 * 1000);
      }
      console.log("Data downloaded, please rerun to evaluate", filename);
    }
  }
  const elementCounts = {};

  a.forEach(element => {
    elementCounts[element] = (elementCounts[element] || 0) + 1;
  });
  
  let entries = Object.entries(elementCounts)
  let s_b_q='',s_s_q='';
  entries.map( ([key, val] = entry) => {
    s_b_q=s_b_q+`min strategy `+key+` - `+val+` times(${Math.round(parseInt(val)*100/buy)}%)`+'\n';
  });



  const selementCounts = {};

  b.forEach(element => {
    selementCounts[element] = (selementCounts[element] || 0) + 1;
  });
  
  let sentries = Object.entries(selementCounts)
  sentries.map( ([key, val] = entry) => {
    if(key==1){s_s_q=s_s_q+`SLM-`+val+`times(${Math.round(parseInt(val)*100/sell)}%)`+'\n';}
    if(key==2){s_s_q=s_s_q+`SLP-`+val+`times(${Math.round(parseInt(val)*100/sell)}%)`+'\n';}
    if(key==3){s_s_q=s_s_q+`SLF-`+val+`times(${Math.round(parseInt(val)*100/sell)}%)`+'\n';}
  });


  // console.log(s_b_q); //  ["The name is Balaji", "The age is 23"]
  // console.log("Output",
  //   "\nstrategy_id----------------------", strategies[0].strategy_id,
  //   "\nstart field----------------------", strategies[0].start_date_time,
  //   "\nend field------------------------", strategies[0].end_date_time,
  //   "\nstart usdt-----------------------", 1000,
  //   "\ndo nothing usdt------------------", ((whataction == "Selling") ? currentMoney / lastaction * firstaction - currentMoney : currentMoney / firstaction * lastaction - currentMoney),
  //   "\nlower than buy times-------------", l_t_b_t,
  //   // "\nstrategy buy qty>>>>>>",s_b_q,
  //   // "\nstrategy sell qty>>>>",data[0].start_date_time,
  //   "\nmin------------------------------", min,
  //   "\nmax------------------------------", max,
  //   "\naverage--------------------------", avg / sell,
  //   "\nbuy------------------------------", buy,
  //   "\nsell-----------------------------", sell,
  //   "\naverage operations per day-------", (buy + sell) / ndays,
  //   "\naverage operations per week------", (buy + sell) * 7 / ndays,
  //   "\nlast_buy_date--------------------", l_b_d,
  //   "\nlast_sell_date-------------------", l_s_d,
  //   "\nlast_op_rate---------------------", l_o_r,
  //   "\ntotal earnings usdt--------------", (currentMoney - 1000),
  //   "\n Strategy result analizying data is stored in result.csv"
  // );
  
  let arr=[ strategies[0].strategy_id,
            strategies[0].start_date_time,
            strategies[0].end_date_time,
            1000,
            (whataction == "Selling") ? currentMoney / lastaction * firstaction - currentMoney : currentMoney / firstaction * lastaction - currentMoney,
            l_t_b_t,
            s_b_q,
            s_s_q,
            min,
            max,
            avg / sell,
            buy,
            sell,
            (buy + sell) / ndays,
            (buy + sell) * 7 / ndays,
            l_b_d,
            l_s_d,
            l_o_r,
            currentMoney - 1000
          ];
  const stream = format({ headers:true });
  stream.pipe(csvFile);
  stream.write(header);
  stream.write(arr);
  stream.end(); 
  console.log("Trading analisys information was stored result.csv in current directory.")    ;
};
main();
