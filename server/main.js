console.log("=================================================");
console.log("========= gameWar SQUARIFIC Server V0.1 =========");
console.log("========= CopyRight SQUARIFIC           =========");
console.log("=================================================");
console.log("");

var settings = require("./settings.js");
var database = require("./database.js");

var mysql = require("mysql").createConnection({
	host: settings.database.hostname,
	user: settings.database.username,
	password: settings.database.password
});
var io = require("socket.io").listen(80);

mysql.connect(function (err) {
	if (err) throw err;
	
	mysql.query("CREATE DATABASE IF NOT EXISTS " + settings.database.database);
	mysql.query("USE " + settings.database.database);
	
	database.createTables(mysql);
	
	console.log("Connected to databse, created database and created tables.");
});