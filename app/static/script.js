var tickersData = localStorage.getItem("tickers");
var tickers = tickersData ? JSON.parse(localStorage.getItem("tickers")) : [];
var holdingsData = localStorage.getItem("holdings");
var holdings = holdingsData ? JSON.parse(localStorage.getItem("holdings")) : [];
var lastPrices = {};
var counter = 60;
var updateInterval;
var tickersData = localStorage.getItem("tickers");
var tickers = tickersData ? JSON.parse(localStorage.getItem("tickers")) : [];
var holdingsData = localStorage.getItem("holdings");
var holdings = holdingsData ? JSON.parse(localStorage.getItem("holdings")) : [];
var lastPrices = {};

function startUpdateCycle() {
  if (updateInterval) clearInterval(updateInterval);

  setInterval(function () {
    counter--;
    $("#counter").text(counter + 1);
    if (counter <= 0) {
      updatePrices();
      counter = 60;
      $("#counter").text(counter + 1);
    }
  }, 1000);
}

startUpdateCycle();

function sellButtonAttach() {
  $(".sell-btn").click(function () {
    var tickerToRemove = $(this).data("ticker");
    var tickerIndex = tickers.indexOf(tickerToRemove);
    tickers = tickers.filter((t) => t != tickerToRemove);
    localStorage.setItem("tickers", JSON.stringify(tickers));
    $(`#${tickerToRemove}`).remove();
    if (tickerIndex !== -1) {
      holdings.splice(tickerIndex, 1);
      localStorage.setItem("holdings", JSON.stringify(holdings));
    }
  });
}

$(document).ready(function () {
  tickers.forEach(function (ticker) {
    addTickerToGrid(ticker);
  });
  updatePrices();

  $("#add-ticker-form").submit(function (e) {
    e.preventDefault();

    var newTicker = $("#new-ticker").val().toUpperCase();
    if (!tickers.includes(newTicker)) {
      tickers.push(newTicker);
      localStorage.setItem("tickers", JSON.stringify(tickers));

      holdings.push(tickers.length);
      localStorage.setItem("holdings", JSON.stringify(holdings));

      addTickerToGrid(newTicker);
    }

    $("#new-ticker").val("");
    updatePrices();
  });
});

function addTickerToGrid(ticker) {
  if ($("#" + ticker).length === 0) {
    var tickerPosition = tickers.indexOf(ticker);

    var uptick = `<svg id="${ticker}-triangle" width="30" height="20" viewBox="10 -10 120 90" xmlns="http://www.w3.org/2000/svg">
      <polygon class="triangle" points="50,10 10,90 90,90" fill="azure"/>
    </svg>`;

    $("#tickers-grid").append(
      `<div id="${ticker}" class="stock-box"><div class="ticker-container"><h2>${uptick}${ticker}</h2><h4 id="${ticker}--pct"></h4></div>
        <div class="ticker-container"><h4>Current Price:</h4><h4 id="${ticker}--price"></h4></div>
        <div class="ticker-container"><h4>Your holding</h4><h4>${holdings[tickerPosition]}</h4></div>
        
        <div class="ticker-container"><button class="buy-btn ticker-btn" data-ticker="${ticker}">Buy</><button class="sell-btn ticker-btn" data-ticker="${ticker}">Sell</button></div></div>`
    );
  }

  sellButtonAttach();
}

$(document).ready(function () {
  tickers.forEach(function (ticker) {
    addTickerToGrid(ticker);
  });
  updatePrices();
  sellButtonAttach();
});

$("#add-ticker-form").submit(function (e) {
  e.preventDefault();

  var newTicker = $("#new-ticker").val().toUpperCase();
  if (!tickers.includes(newTicker)) {
    tickers.push(newTicker);
    localStorage.setItem("tickers", JSON.stringify(tickers));

    holdings.push(tickers.length);
    localStorage.setItem("holdings", JSON.stringify(holdings));

    addTickerToGrid(newTicker);
  }

  $("#new-ticker").val("");
  updatePrices();
});

$(".sell-btn").click(function () {
  console.log("clicked");
  var tickerToRemove = $(this).data("ticker");
  tickers = tickers.filter((t) => t != tickerToRemove);
  localStorage.setItem("tickers", JSON.stringify(tickers));
  $(`#${tickerToRemove}`).remove();
});

function updatePrices() {
  tickers.forEach(function (ticker) {
    $.ajax({
      url: "/get_stock_data",
      type: "POST",
      data: JSON.stringify({ ticker: ticker }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        var changePercent =
          Number((data.currentPrice - data.openPrice) / data.openPrice) * 100;
        var colourClass;
        if (changePercent <= -2) {
          colourClass = "dark-red";
        } else if (changePercent <= 0) {
          colourClass = "red";
        } else if (changePercent === 0) {
          colourClass = "gray";
        } else if (changePercent <= 2) {
          colourClass = "green";
        } else {
          colourClass = "bright-green";
        }
        //rotate triange svg
        var triangle = document.getElementById(`${ticker}-triangle`);
        var polygon = triangle.querySelector(`polygon`);

        if (changePercent > 0) {
          polygon.setAttribute("fill", "#05be3a");
          polygon.classList.remove("down");
          polygon.classList.add("up");
        } else if (changePercent < 0) {
          polygon.setAttribute("fill", "#f85656");
          polygon.classList.remove("up");
          polygon.classList.add("down");
        }

        $(`#${ticker}--price`).text(`$${data.currentPrice.toFixed(2)}`);
        $(`#${ticker}--pct`).text(`${changePercent.toFixed(2)}%`);

        $(`#${ticker}--price`)
          .removeClass(`dark-red red gray green bright-green`)
          .addClass(colourClass);
        $(`#${ticker}--pct`)
          .removeClass(`dark-red red gray green bright-green`)
          .addClass(colourClass);

        var flashClass;
        if (lastPrices[ticker] > data.currentPrice) {
          flashClass = "red-flash";
        } else if (lastPrices[ticker] < data.currentPrice) {
          flashClass = "green-flash";
        } else {
          flashClass = "gray-flash";
        }

        lastPrices[ticker] = data.currentPrice;

        $(`#${ticker}`).addClass(flashClass);
        setTimeout(function () {
          $(`#${ticker}`).removeClass(flashClass);
        }, 250);
      },
    });
  });
}
