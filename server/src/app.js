const express = require("express");
const path = require("path");
const cors = require("cors");

const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error("Erro interno:", err);
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : "Erro interno do servidor";
  res.status(statusCode).json({ erro: message });
});

module.exports = app;