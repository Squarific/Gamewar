console.log("=================================================");
console.log("========= gameWar SQUARIFIC Server V0.1 =========");
console.log("========= CopyRight SQUARIFIC           =========");
console.log("=================================================");
console.log("");

var settings = require("./settings.js");
var database = require("./database.js");
var CryptoJS = require("./CryptoJSSha256.js");
var LoginHandlers = require("./loginhandlers.js");

var mysql = require("mysql").createConnection({
	host: settings.database.hostname,
	user: settings.database.username,
	password: settings.database.password
});
var loginhandlers = new LoginHandlers(mysql, CryptoJS);

mysql.connect(function (err) {
	if (err) throw err;
	
	mysql.query("CREATE DATABASE IF NOT EXISTS " + settings.database.database);
	mysql.query("USE " + settings.database.database);
	
	database.createTables(mysql);
	
	console.log("Connected to databse, created database and created tables.");
	
	var io = require("socket.io").listen(settings.server.port);
	
	console.log("Accepting connections on port " + settings.server.port);
	iobind(io);
});

function iobind (io) {
	io.sockets.on("connection", function (socket) {
		socket.on("login", function (data, response) {
			if (!data || !data.name) {
				if (!socket.userdata || !socket.userdata.name) {
					loginhandlers.newguest(socket);
				} else {
					response("Please provide the name of the account.");
				}
			} else {
				loginhandlers.login(socket, data.username, CryptoJS.SHA256(data.password), response);
			}
		});
		
		socket.on("changesetting", function (data, response) {
			
		});
	});
}