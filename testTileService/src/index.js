var express = require("express");
var app = express();
var cors = require("cors");
const { createCanvas } = require("canvas");

const width = 256;
const height = 256;
const canvas = createCanvas(width, height);
const context = canvas.getContext("2d");
context.font = "30px Open Sans";

app.get("/:z/:x/:y.png", cors(), function (req, res) {
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#000";
  context.fillRect(10, 10, width - 20, height - 20);
  context.fillStyle = "#fff";
  context.fillRect(15, 15, width - 30, height - 30);
  context.fillStyle = "#000";
  context.fillText(`Zoom: ${req.params.z}`, 20, 50);
  context.fillText(`X: ${req.params.x}`, 20, 90);
  context.fillText(`Y: ${req.params.y}`, 20, 130);

  res.end(canvas.toBuffer("image/png"), "binary");
});

app.listen(3001);
