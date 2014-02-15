var gameWarGames = gameWarGames || {};
gameWarGames.GameName = function GameName (gameId, targetdiv, gameWar) {
	this.description = "HTML STRING explaining the game";
	this.name = "Humanized GameName";
	this.settings = {
		settingName: {
			type: "number",
			input: {
				min: 3,
				max: 5,
				value: 4
			},
			label: "LabelName of setting",
			info: "Info when mousehover"
		}
	};

	var lastGameData = {};
	var errorDiv, successDiv;
	
	var helpers = {
		helperFunction: function () {
		}
	};
	
	var listeners = {
		eventName: function (data) {
			
		}
	};
	
	if (typeof gameId === "Number") {
		//A real instance is created as opposed to just wanting the description, name and settings
		while (targetdiv.firstChild) {
			targetdiv.removeChild(targetdiv.firstChild);
		}
		gameWar.addNetworkListeners(gameId, listeners);
		gameWar.sendMessage(gameId, "opengame");
	}
	
	this.kickPlayer = function (playerId) {
		gameWar.sendMessage(gameId, "kick", playerId);
	};
	
	this.close = function () {
		gameWar.removeNetworkListeners(gameId, listeners);
	};
};