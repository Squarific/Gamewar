module.exports = function Communicationhandlers (settings, handlers, gamemessages) {
	var io = require("socket.io").listen(settings.server.port);
	io.set('log level', 1);
	io.sockets.on("connection", function (socket) {
		socket.on("login", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			if (!data || !data.username) {
				if (!data || !socket.userdata || !socket.userdata.name) {
					handlers.userhandlers.newguest(socket, callback);
				} else {
					callback({error: "Please provide the name of the account you want to login to."});
				}
			} else {
				handlers.userhandlers.login(socket, data.username, CryptoJS.SHA256(data.password), callback);
			}
		});

		socket.on("changesettings", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			handlers.userhandlers.changeUserSettings(socket, data, callback);
		});
		
		socket.on("emaillist", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			if (!socket.userdata || typeof socket.userdata.id !== "number") {
				callback({error: "You can't ask for emails when not logged in."});
				return;
			}
			handlers.userhandlers.emails(socket.userdata.id, callback);
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
			handlers.gamehandlers.newGame(socket, data, games, callback);
		});
		
		socket.on("gamelobbylist", function (data, callback) {
			handlers.gamehandlers.getOpenGames(callback);
		});
		
		socket.on("activegameslist", function (data, callback) {
			if (typeof callback !== "function") {
				callback = function () {};
			}
			if (!socket.userdata || typeof socket.userdata.id !== "number") {
				callback({error: "You can't ask for a list of your active games when not logged in."});
				return;
			}
			handlers.gamehandlers.getActiveGames(socket.userdata.id, callback);
		});
		
		socket.on("gamename", function (data, callback ) {
			handlers.gamehandlers.getGameName(data, callback);
		});
		
		socket.on("gameMessage", function (data) {
			gamemessages.callback(socket, data);
		});
		
		socket.on("wallet", function (data, callback) {
			
		});
	});
	
	console.log("Accepting connections on port " + settings.server.port);
};