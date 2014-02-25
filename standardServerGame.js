module.exports = function GameName (mysql, messages, settings, gameFunds, Listeners, lobby, chat) {
	this.name = "";
	this.settings = {
		settingName: {
			type: "",
			input: {
				min: ,
				max: 
			}
		},
		players: {
			type: "number",
			input: {
				min: 3,
				max: 5
			}
		},
		betAmount: {
			type: "number",
			input: {
				min: 0,
				max: Infinity
			}
		}
	};
	
	var listenersManager = new Listeners(messages);

	var helpers = {
		createTables: function () {
			//Tables should be created if not exists on startup
		};
	};
	
	var listeners = {
		event: function (socket, gameId, data) {
			listenersManager.callGameListeners(gameId, event, data);
		},
		opengame: function (socket, gameId, data) {
			chat.openGame(socket, gameId, data);
			lobby.openGame(socket, gameId, data);
			listenersManager.addGameListener(gameId, socket);
			socket.on("disconnect", function () {
				listeners.close(socket, gameId, data);
			});
		},
		close: function (socket, gameId, data) {
			chat.closeGame(socket, gameId, data);
			lobby.closeGame(socket, gameId, data);
			listenersManager.removeGameListener(socket);
		}
	};
	
	helpers.createTables();
	messages.register("gamename", listeners);
};