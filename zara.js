const puppeteer = require("puppeteer-extra");
const fs = require("fs/promises");
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";

const scrapeData = async (page, url) => {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  var element = null;
  var name, price, description, size, imageUrl, colors, discount;
  try {
    element = await page.$(
      "div.product-detail-info > div.product-detail-info__header > h1"
    );
    name = await page.evaluate((el) => el.textContent, element);
  } catch {}

  try {
    element = await page.$(
      "div.product-detail-info > div.product-detail-description > div > div > div > p"
    );
    description = await page.evaluate((el) => el.textContent, element);
  } catch {}

  try {
    element = await page.$(
      "div.product-detail-info > div.product-detail-info__price > div > span > span > span > div > span"
    );
    price = await page.evaluate((el) => el.textContent, element);
  } catch {}

  try {
    size = await page.$$eval(
      ".product-detail-size-selector__size-list > li > div > div > span",
      (item) => {
        return item.map((x) => x.textContent.trim());
      }
    );
  } catch {}
  try {
    await page.evaluate(async () => {
      const num = document.querySelectorAll("picture.media-image > img").length;
      for (let x = 560; x < num * 700; x++) {
        setTimeout(() => {
          document.querySelector(
            "div.product-detail-view__main > div.product-detail-view__main-content > section > ul"
          ).style.transform = `translate3d(0px, -${x}px, 0px)`;
        }, [10]);
      }
    });
    await page.waitForTimeout(2000);

    imageUrl = await page.$$eval(
      "picture.media-image > img:nth-child(3)",
      (item) => {
        return item.map((y) => {
          return y.getAttribute("src");
        });
      }
    );
    imageUrl.filter((item) => !item.includes("transparent-background"));
  } catch (err) {}
  try {
    colors = await page.$$eval(
      "div.product-detail-color-selector.product-detail-info__color-selector > div > ul > li > button > span > span",
      (item) => {
        return item.map((y) => {
          return y.getAttribute("style").split("background-color:")[1];
        });
      }
    );
  } catch {}

  // document.querySelector("span.price-current__amount > div > span").textContent;
  try {
    element = await page.$("span.price-current__amount > div > span");
    discount = await page.evaluate((el) => el.textContent, element);
    if (discount === price) {
      discount = null;
    }
  } catch {}
  var result = { name, price, description, size, imageUrl, colors };
  // console.log(result);
  await pushData({
    name,
    price,
    description,
    size,
    imageUrl,
    colors,
    discount,
  });

  // return result;
  return;
};

const App = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: ["--enable-automation"],
    slowMo: 100,
  });
  const page = await browser.newPage();
  const scrapePage = await browser.newPage();

  // setting user agent so google not gonna think we are bot or something else
  await page.setUserAgent(USER_AGENT);

  // Navigating to URL
  // const url =
  // "https://www.zara.com/in/en/zara-athleticz-sweatshirts-l4655.html?v1=2112947";
  const url =
    "https://www.zara.com/in/en/zara-athleticz-trousers-l4654.html?v1=2112949";
  await page.goto(url);
  const collection = await page.$$("div.product-groups > section > ul > li");

  const allURLs = [];
  for (let x of collection) {
    var a = null;
    try {
      a = await page.evaluate(
        (el) => el.querySelector("a").getAttribute("href"),
        x
      );
      if (allURLs.includes(a)) {
        continue;
      }
      allURLs.push(a);
      await scrapeData(scrapePage, a);
    } catch {}
  }
};

const pushData = async (data) => {
  let zara = [];
  const file = await fs.readFile("zara.json");
  zara = JSON.parse(file);
  zara.push(data);
  await fs.writeFile("zara.json", JSON.stringify(zara, null, 4));
};

// App();
module.exports = { App };
