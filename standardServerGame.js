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
	
	var listenersManager = new Listeners();

	var helpers = {
		createTables: function () {
			
		};
	};
	
	var listeners = {
		event: function (socket, gameId, data) {
			
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