//imports
var express = require("express");
var bodyParser = require("body-parser");
var apiRouter = require("./apiRouter").router;

//constantes
const port = 8080;

//instanciate server
var server = express();

//configure body-parser
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

//configure routes
server.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("<h1>Bonjour sur mon super serveur!</h1>");
});

server.use("/api/", apiRouter);

//lanche server
server.listen(port, () => {
  console.log(`servuer en écoute sur le port ${port}`);
});
