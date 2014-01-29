console.log("====================================================");
console.log("========== gameWar SQUARIFIC Server V0.1a ==========");
console.log("========== CopyRight SQUARIFIC            ==========");
console.log("====================================================");
console.log("");

var settings = require("./settings.js");
var database = require("./libraries/database.js");
var CryptoJS = require("./libraries/CryptoJSSha256.js");
var Gamehandlers = require("./libraries/gamehandlers.js");
var MessageManager = require("./libraries/messagemanager.js");
var Userhandlers = require("./libraries/userhandlers.js");
var GameFunds = require("./libraries/gamefunds.js");
var Backup = require("./libraries/backup.js");
var Blockchain = require("./libraries/blockchain.js");

var mysqlManager = require("mysql");
var mysql;

function createConnection () {
	mysql = mysqlManager.createConnection({
		host: settings.database.hostname,
		user: settings.database.username,
		password: settings.database.password
	});
}

createConnection();

var gamehandlers = new Gamehandlers(mysql, settings);
var userhandlers = new Userhandlers(mysql, CryptoJS);
var messages = new MessageManager(gamehandlers);
var gameFunds = new GameFunds(mysql);
var backup = new Backup(mysql);
var blockchain = new Blockchain(mysql, settings.blockchain);
var games = {};

database.createDatabaseAndTables(mysql, settings.database);

for (var key in settings.games) {
	games[key] = new (require("./games/" + key + ".js"))(mysql, messages, settings.gameSettings, gameFunds);
}
console.log("All games loaded succesfully.");
	
var io = require("socket.io").listen(settings.server.port);
io.set('log level', 1);
io.sockets.on("connection", function (socket) {
	socket.on("login", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		if (!data || !data.username) {
			if (!data || !socket.userdata || !socket.userdata.name) {
				userhandlers.newguest(socket, callback);
			} else {
				callback({error: "Please provide the name of the account you want to login to."});
			}
		} else {
			userhandlers.login(socket, data.username, CryptoJS.SHA256(data.password), callback);
		}
	});

	socket.on("changesettings", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		userhandlers.changeUserSettings(socket, data, callback);
	});
	
	socket.on("emaillist", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		if (!socket.userdata || typeof socket.userdata.id !== "number") {
			callback({error: "You can't ask for emails when not logged in."});
			return;
		}
		userhandlers.emails(socket.userdata.id, callback);
	});
	
	socket.on("gamelist", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		callback(settings.games);
	});
	
	socket.on("newgame", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		gamehandlers.newGame(socket, data, games, callback);
	});
	
	socket.on("gamelobbylist", function (data, callback) {
		gamehandlers.getOpenGames(callback);
	});
	
	socket.on("activegameslist", function (data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		if (!socket.userdata || typeof socket.userdata.id !== "number") {
			callback({error: "You can't ask for a list of your active games when not logged in."});
			return;
		}
		gamehandlers.getActiveGames(socket.userdata.id, callback);
	});
	
	socket.on("gamename", function (data, callback ) {
		gamehandlers.getGameName(data, callback);
	});
	
	socket.on("gameMessage", function (data) {
		messages.callback(socket, data);
	});
});
console.log("Accepting connections on port " + settings.server.port);