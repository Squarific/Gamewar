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
			
		}
	};
	
	helpers.createTables();
	messages.register("gamename", listeners);
};