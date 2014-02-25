var gameWarGames = gameWarGames || {};
gameWarGames.GameName = function GameName (gameId, targetdiv, gameWar, lobby, chat) {
	this.description = "HTML STRING explaining the game";
	this.name = "Human Readable Name";
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
		},
		players: {
			type: "number",
			input: {
				min: 3,
				max: 5,
				value: 4
			},
			label: "Players",
			info: "How many players will be playing the game?"
		},
		betAmount: {
			type: "number",
			input: {
				min: 0,
				max: Infinity,
				value: 0
			},
			label: "Bet amount",
			info: "How much do you want to bet?"
		}
	};
	
	if (typeof gameId !== "number") {
		return;
	}

	var lastGameData = {};
	var errorDiv, successDiv;
	
	var stylers = {
		styleCreator: function () {
		}
	};
	
	var helpers = {
		helperFunction: function () {
		}
	};
	
	var listeners = {
		eventName: function (data) {
		}
	};
	
	this.kickPlayer = function (playerId) {
		gameWar.sendMessage(gameId, "kick", playerId);
	};
	
	this.close = function () {
		gameWar.sendMessage(gameId, "close");
		gameWar.removeNetworkListeners(gameId, listeners);
	};
	
	while (targetdiv.firstChild) {
		targetdiv.removeChild(targetdiv.firstChild);
	}
	gameWar.addNetworkListeners(gameId, listeners);
	gameWar.sendMessage(gameId, "opengame");
};