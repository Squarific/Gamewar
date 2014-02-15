console.log("====================================================");
console.log("========== gameWar SQUARIFIC Server V0.1a ==========");
console.log("========== CopyRight SQUARIFIC            ==========");
console.log("====================================================");
console.log("");

var settings = require("./settings.js");
var database = require("./libraries/database.js");
var CryptoJS = require("./libraries/CryptoJSSha256.js");
var Gamehandlers = require("./libraries/gamehandlers.js");
var GameMessageManager = require("./libraries/gamemessagemanager.js");
var Communicationhandlers = require("./libraries/Communicationhandlers.js");
var Userhandlers = require("./libraries/userhandlers.js");
var GameFunds = require("./libraries/gamefunds.js");
var Backup = require("./libraries/backup.js");
var Blockchain = require("./libraries/blockchain.js");
var Listeners = require("./libraries/listeners.js");

var mysqlManager = require("mysql");
var mysql = mysqlManager.createConnection({
	host: settings.database.hostname,
	user: settings.database.username,
	password: settings.database.password
});
mysql.on("error", function (err) {
	console.log("<UNHANDELD DATABASE ERROR>", err);
	throw "</UNHANDELD DATABASE ERROR>";
});

var handlers = {}, games = {},
	gamemessages, gameFunds, backup, blockchain, communicationhandlers;

database.createDatabaseAndTables(mysql, settings.database, function () {
	handlers.gamehandlers = new Gamehandlers(mysql, settings);
	handlers.userhandlers = new Userhandlers(mysql, CryptoJS);
	gamemessages = new GameMessageManager(handlers.gamehandlers);
	
	gameFunds = new GameFunds(mysql, settings);
	backup = new Backup(mysql);
	blockchain = new Blockchain(mysql, settings.blockchain);
	communicationhandlers = new Communicationhandlers(settings, handlers, gamemessages, gameFunds, games, CryptoJS);

	for (var key in settings.games) {
		games[key] = new (require("./games/" + key + ".js"))(mysql, gamemessages, settings.gameSettings, gameFunds, Listeners);
	}
	console.log("All games loaded succesfully.");
});