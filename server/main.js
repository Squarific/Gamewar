console.log("=================================================");
console.log("========= gameWar SQUARIFIC Server V0.1 =========");
console.log("========= CopyRight SQUARIFIC           =========");
console.log("=================================================");
console.log("");

var settings = require("./settings.js");
var database = require("./database.js");
var CryptoJS = require("./CryptoJSSha256.js");
var Eventhandlers = require("./eventhandlers.js");

var mysql = require("mysql").createConnection({
	host: settings.database.hostname,
	user: settings.database.username,
	password: settings.database.password
});
var eventhandlers = new Eventhandlers(mysql, CryptoJS);

var games = {};
for (var key in settings.games) {
	games[key] = new (require("./games/" + key + ".js"))(mysql);
}

mysql.connect(function (err) {
	if (err) throw err;
	
	mysql.query("CREATE DATABASE IF NOT EXISTS " + settings.database.database);
	mysql.query("USE " + settings.database.database);
	
	database.createTables(mysql);
	
	console.log("Connected to databse, created database and created tables.");
	
	var io = require("socket.io").listen(settings.server.port);
	io.set('log level', 2);
	
	console.log("Accepting connections on port " + settings.server.port);
	iobind(io);
});

function iobind (io) {
	io.sockets.on("connection", function (socket) {
		socket.on("login", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			if (!data || !data.username) {
				if (!data || !socket.userdata || !socket.userdata.name) {
					eventhandlers.newguest(socket, callback);
				} else {
					callback({error: "Please provide the name of the account you want to login to."});
				}
			} else {
				eventhandlers.login(socket, data.username, CryptoJS.SHA256(data.password), callback);
			}
		});

		socket.on("changesettings", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			eventhandlers.changeUserSettings(socket, data, callback);
		});
		
		socket.on("emaillist", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			if (!socket.userdata || typeof socket.userdata.id !== "number") {
				callback({error: "You can't ask for emails when not logged in."});
				return;
			}
			eventhandlers.emails(socket.userdata.id, callback);
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
			eventhandlers.newGame(socket, data, settings, games, callback);
		});
		
		socket.on("gamelobbylist", function (data, callback) {
			callback(eventhandlers.getOpenGames());
		});
	});
}