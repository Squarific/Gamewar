module.exports = function GameListeners (messages) {
	var gameListeners = {};
	
	this.addGameListener = function (gameId, socket) {
		gameListeners[gameId] = gameListeners[gameId] || [];
		if (gameListeners[gameId].indexOf(socket) === -1) {
			gameListeners[gameId].push(socket);
		}
	};

	this.removeGameListener = function (socket) {
		for (var gameId in gameListeners) {
			var index = gameListeners[gameId].indexOf(socket);
			if (index !== -1) {
				gameListeners[gameId].splice(index, 1);
			}
		}
	};

	this.callGameListeners = function (gameId, event, data) {
		gameListeners[gameId] = gameListeners[gameId] || {};
		for (var key = 0; key < gameListeners[gameId].length; key++) {
			messages.emit(gameListeners[gameId][key], gameId, event, data);
		}
	};
	
	this.callGameListenersPrepared = function (gameId, event, prepareData) {
		gameListeners[gameId] = gameListeners[gameId] || {};
		for (var key = 0; key < gameListeners[gameId].length; key++) {
			messages.emit(gameListeners[gameId][key], gameId, event, prepareData(gameListeners[gameId][key]));
		}
	};
};