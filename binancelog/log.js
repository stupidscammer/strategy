const fs = require("fs");
const { Console } = require("console");
async function exportLog(path, logData) {
  //Record all logs to log file
  try {
    await fs.promises.appendFile(path, logData);
  } catch (err) {
    console.log("The file has not been saved!");
  }
}

async function exportLogAndConsole(path, logData) {
  console.log(logData);
  //Record all logs to log file
  try {
    await fs.promises.appendFile(path, logData);
  } catch (err) {
    console.log("The file has not been saved!");
  }
}

const logShouldBuy = (logRealPath, analysis) => {
  (async () => {
    await exportLogAndConsole(logRealPath, "\n---------------------");
    await exportLogAndConsole(logRealPath, "\nIt is time for buying.");
    await exportLogAndConsole(logRealPath, "\nReason:Before 20 min:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPriceBefore20));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice20MinuteAgo)
    );
    await exportLogAndConsole(logRealPath, "\nBefore 10 min:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPriceBefore10));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice10MinuteAgo)
    );
    await exportLogAndConsole(logRealPath, "\n1 Minute:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPrice1MinuteAgo));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice1MinuteAgo)
    );
    await exportLogAndConsole(
      logRealPath,
      "\nSo It fits to the buying strategy"
    );
  })();
};

const logBuying = (logRealPath, balances) => {
  (async () => {
    await exportLogAndConsole(logRealPath, "\n-------Buying-------");
    await exportLogAndConsole(logRealPath, "\nBefore:ETHs balances:\n");
    await exportLogAndConsole(logRealPath, String(balances.ETH.available));
    await exportLogAndConsole(logRealPath, "\nUSDTs:balances:\n");
    await exportLogAndConsole(logRealPath, String(balances.USDT.available));
  })();
};

const logBalances = (logRealPath, balances) => {
  (async () => {
    await exportLogAndConsole(logRealPath, "\nNow:ETHs balances:\n");
    await exportLogAndConsole(logRealPath, String(balances.ETH.available));
    await exportLogAndConsole(logRealPath, "\nNow:USDTs balances:\n");
    await exportLogAndConsole(logRealPath, String(balances.USDT.available));
  })();
};

const logShouldNotBuy = (logRealPath, analysis, balances) => {
  (async () => {
    await exportLogAndConsole(logRealPath, "\n---------------------");
    await exportLogAndConsole(logRealPath, "\nCurrent ETH balances:");
    await exportLogAndConsole(logRealPath, String(balances.ETH.available));
    await exportLogAndConsole(logRealPath, "\nCurrent USDT balances:");
    await exportLogAndConsole(logRealPath, String(balances.USDT.available));
    await exportLogAndConsole(logRealPath, "\nIt is not time for buying.");

    await exportLogAndConsole(logRealPath, "\nReason:Before 20 min:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPriceBefore20));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice20MinuteAgo)
    );
    await exportLogAndConsole(logRealPath, "\nBefore 10 min:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPriceBefore10));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice10MinuteAgo)
    );
    await exportLogAndConsole(logRealPath, "\n1 Minute:Low Price:");
    await exportLogAndConsole(logRealPath, String(analysis.lowPrice1MinuteAgo));
    await exportLogAndConsole(logRealPath, " & Close Price:");
    await exportLogAndConsole(
      logRealPath,
      String(analysis.closePrice1MinuteAgo)
    );
    await exportLogAndConsole(
      logRealPath,

      "\nSo It doesn't fit to the buying strategy"
    );
  })();
};

const logSelling = (logRealPath, price, cprice, mprice) => {
  (async () => {
    //print that time is for selling
    exportLogAndConsole(logRealPath, "\n---------------------");
    exportLogAndConsole(logRealPath, "\nIt is time for selling.");
    exportLogAndConsole(logRealPath, "\nThe price when I was buying:");
    exportLogAndConsole(logRealPath, String(price));
    exportLogAndConsole(logRealPath, "\nThe present price is:");
    exportLogAndConsole(logRealPath, String(cprice));

    /////according to your strategy invetigate if now is for selling.
    //first strategy for selling
    if (cprice < (price * 995) / 1000) {
      exportLogAndConsole(
        logRealPath,
        "\nIt fits to the first selling strategy."
      );
    }
    //second strategy for selling
    else if (mprice > price * 1.007 && cprice <= price * 1.007) {
      exportLogAndConsole(
        logRealPath,
        "\nIt fits to the second selling strategy."
      );
    }
    //third strategy for selling
    else {
      exportLogAndConsole(
        logRealPath,
        "\nIt fits to the third selling strategy."
      );
    }
  })();
};

const logNotSelling = (logRealPath, price, cprice, balances) => {
  (async () => {
    await exportLogAndConsole(logRealPath, "\n---------------------");
    await exportLogAndConsole(logRealPath, "\nCurrent ETH balances:");
    await exportLogAndConsole(logRealPath, String(balances.ETH.available));
    await exportLogAndConsole(logRealPath, "\nCurrent USDT balances:");
    await exportLogAndConsole(logRealPath, String(balances.USDT.available));
    await exportLogAndConsole(logRealPath, "\nIt is not time for selling.");
    await exportLogAndConsole(logRealPath, "\nThe price when I was buying:");
    await exportLogAndConsole(logRealPath, String(price));
    await exportLogAndConsole(logRealPath, "\nThe present price is:");
    await exportLogAndConsole(logRealPath, String(cprice));
    await exportLogAndConsole(
      logRealPath,
      "\nSo It doesn't fit to your selling strategy.\n"
    );
    await exportLogAndConsole(logRealPath, "\n---------------------");
  })();
};

module.exports = {
  exportLog,
  exportLogAndConsole,
  logShouldBuy,
  logShouldNotBuy,
  logBalances,
  logBuying,
  logSelling,
  logNotSelling,
};
