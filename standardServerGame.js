module.exports = function GameName (mysql, messages, settings, gameFunds, Listeners) {
	this.name = "";
	this.settings = {
		settingName: {
			type: "",
			input: {
				min: ,
				max: 
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
			listenersManager.callGameListeners(gameId, event, data); //Send to all clients listening to a certain gameId
		},
		opengame: function (socket, gameId, data) {
			listenersManager.addGameListener(gameId, socket);
			socket.on("disconnect", function () {
				listenersManager.removeGameListener(socket);
			});
		}
	};
	
	helpers.createTables();
	messages.register("gamename", listeners);
};