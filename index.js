const express = require("express");
const PORT = process.env.PORT || 8000;
const app = express();

const data = require("./zara.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(express.static(__dirname + "/data"));

app.get("/", (req, res) => {
  res.json(data);
});

app.listen(PORT, (req, res) => {
  console.log(`Server started on PORT ${PORT}`);
});

const CronJob = require("cron").CronJob;
const { App } = require("./zara");

var job = new CronJob(
  "*/30 * * * * *",
  function () {
    App();
  },
  null,
  true,
  "America/Los_Angeles"
);
