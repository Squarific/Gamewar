module.exports = function MessageManager (eventhandlers) {
	var gameCallbacks = {};
	this.register = function (game, callbacks) {
		gameCallbacks[game] = callbacks;
	};
	this.callback = function (socket, data) {
		eventhandlers.getGameName(data.gameId, function (name) {
			if (name.error) {
				console.log("Client send message to non existant game DATA: " + data);
				socket.emit("error", "There is no game with gameId '" + data.gameId + "'");
				return;
			}
			for (var key in gameCallbacks[name]) {
				if (key === data.name) {
					gameCallbacks[name][key](socket, data.gameId, data.data);
					return;
				}
			}
		});
	};
	this.emit = function (socket, gameId, name, data) {
		socket.emit("gameMessage", {
			gameId: gameId,
			name: name,
			data: data
		});
	};
};