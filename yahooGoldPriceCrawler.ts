import axios from 'axios';
import * as cheerio from 'cheerio';

import yahooFinance from 'yahoo-finance2';
let TelegramBot = require("node-telegram-bot-api")

let lastPrice: number = 0;
let currentPrice: number = 0;

let lastPeriodPrice: number = 0;
let currentPeriodPrice: number =0;

const PERIOD_IN_MINISECONDS: number = 5*60*1000;
const THRESHOLD: number = 15;
const RANGE_THRESHOLD: number = 25;

console.log("start log");
async function crawlYahooGoldPrice() {
  try {
    
    // const quote = await yahooFinance.quote('GC=F');
    // const { regularMarketPrice , currency } = quote;
    // currentPrice = regularMarketPrice as number;

    currentPrice = await extractGoldPriceYahoo();

    let currentDateTime = addHoursToDate(new Date(), 7).toUTCString();
    console.log(`Price:${currentPrice}, time: ${currentDateTime}`);
    
    if (lastPrice > 0) {
      if (currentPrice > 0) {
        currentPeriodPrice = Math.abs(currentPrice - lastPrice);
        if (lastPeriodPrice > 0) {
          if (currentPeriodPrice / lastPeriodPrice > THRESHOLD) {
              console.log("breakout");
              sendEmail(`[Ratio-BO] time: ${currentDateTime}`, `Check price ratio : ${currentPeriodPrice/ lastPeriodPrice}, cp:${currentPrice}, lp:${lastPrice}, cpr:${currentPeriodPrice}, lpr:${lastPeriodPrice}`, "tungnvdtbk@gmail.com");
          }
          if (currentPeriodPrice  > RANGE_THRESHOLD) {
            console.log("breakout");
            sendEmail(`[Range-BO] time: ${currentDateTime}`, `Check price ratio: ${currentPeriodPrice/ lastPeriodPrice}, cp:${currentPrice}, lp:${lastPrice}, cpr:${currentPeriodPrice}, lpr:${lastPeriodPrice}`, "tungnvdtbk@gmail.com");
          }
        }
      }
    }

    console.log("price", lastPrice, currentPrice);
    console.log("period price", lastPeriodPrice, currentPeriodPrice);

    if (lastPeriodPrice > 0 && currentPeriodPrice > 0) {
      console.log("Ratio:", currentPeriodPrice/ lastPeriodPrice);
    }

    lastPrice = currentPrice;
    lastPeriodPrice = currentPeriodPrice;
    
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

const token = '1421619245:AAG_qOFHEu4WG4FvMMe9bcZ-a9-jb6lOiOA';
const bot = new TelegramBot(token, { polling: true });
function sendEmail(subject: string, content: string, to: string) { 

  // Send the message
  bot.sendMessage(1436262935, `${subject}--${content}`)
  .then(() => {
      console.log('Message sent successfully');
  })
  .catch((error) => {
      console.error('Error sending message:', error);
  });
  
}

async function extractGoldPrice()  {
  let output: number = 0;
  try {
      const response = await axios.get('https://www.investing.com/commodities/gold');
      const htmlContent = response.data;

      const $ = cheerio.load(htmlContent);
      const priceValue = $('div[data-test="instrument-price-last"]').text().trim();
      

      if (priceValue.length > 0) {
        output = parseNumberWithCommas(priceValue);  
        console.log("Gold Price:", priceValue);
      } else {
          console.log("Price not found");
      }
      
  } catch (error) {
      console.error("Error fetching or parsing the page:", error.message);
  }
  return output ;
}

async function extractGoldPriceYahoo()  {
  let output: number = 0;
  try {
      const response = await axios.get('https://finance.yahoo.com/recent-quotes/',
      {headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'
      }});
      const htmlContent = response.data;

      const $ = cheerio.load(htmlContent);
      const priceValue = $('fin-streamer[data-symbol="GC=F"][data-field="regularMarketPrice"]').text().trim();
      

      if (priceValue.length > 0) {
        output = parseNumberWithCommas(priceValue);  
        console.log("Gold Price:", priceValue);
      } else {
          console.log("Price not found");
      }
      
  } catch (error) {
      console.error("Error fetching or parsing the page:", error.message);
  }
  return output ;
}
function parseNumberWithCommas(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}


function addHoursToDate(date: Date, hoursToAdd: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setHours(newDate.getHours() + hoursToAdd);
  return newDate;
}

//extractGoldPrice();

// setInterval(async() => {
//   console.log("price yahoo:",  await extractGoldPriceYahoo())
// }, 5000)

setInterval(crawlYahooGoldPrice, PERIOD_IN_MINISECONDS);
//setInterval(crawlYahooGoldPrice, 1000);






