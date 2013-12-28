var gameWarGames = gameWarGames || {};
gameWarGames.Hearts = function Hearts (gameId, targetdiv, gameWar) {
	this.description = "Hearts (black lady) game.";
	this.name = "Hearts (black lady)";
	this.settings = {
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
		endPoints: {
			type: "number",
			input: {
				min: 0,
				max: 300,
				value: 100
			},
			label: "End points",
			info: "When is the game over? This has a huge influence over how long the game will take."
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
		},
		maxDecisionTime: {
			type: "number",
			input: {
				min: 0,
				max: 2880,
				value: 2
			},
			label: "Maximum decision time (minutes)",
			info: "Maximum amount of minutes someone has to make a decision, max 2 days."
		}
	};
	
	var helpers = {
		showLobby: function (data) {
			while (targetdiv.firstChild) {
				targetdiv.removeChild(targetdiv.firstChild);
			}
			var block = targetdiv.appendChild(style.currentStyle.blockText());
			block.style.textAlign = "center";
			var playerList = block.appendChild(style.currentStyle.lobbyPlayerList(gameWar, data));
			var settingList = block.appendChild(style.currentStyle.lobbySettingsList(data, this.settings));
			var actionList = block.appendChild(style.currentStyle.lobbyBlock());
			actionList.appendChild(document.createTextNode("Actions: "));
			actionList.appendChild(document.createElement("br"));
			actionList.appendChild(document.createElement("br"));
			var joined;
			for (var key = 0; key < data.players.length; key++) {
				if (data.players[key].id === gameWar.userId) {
					joined = true;
				}
			}
			if (joined) {
				var button = actionList.appendChild(style.currentStyle.button("Leave game", function () {
					gameWar.sendMessage(gameId, "leave");
				}));
				button.style.minWidth = "92%";
				button.style.margin = "3px";
				if (data.creatorId === gameWar.userId && data.players.length === data.maxPlayers) {
					var button = actionList.appendChild(style.currentStyle.button("Start game", function () {
						gameWar.sendMessage(gameId, "start");
					}));
					button.style.minWidth = "92%";
					button.style.margin = "3px";
				}
			} else if (data.players.length > 0 && data.players.length < data.maxPlayers) {
				var button = actionList.appendChild(style.currentStyle.button("Join game", function () {
					gameWar.sendMessage(gameId, "join");
				}));
				button.style.minWidth = "92%";
				button.style.margin = "3px";
			}
		}.bind(this)
	};

	if (typeof gameId === "number") {
		while (targetdiv.firstChild) {
			targetdiv.removeChild(targetdiv.firstChild);
		}
		var listeners = {
			gamelobby: function (data) {
				helpers.showLobby(data);
				console.log(data);
			}.bind(this)
		};
		gameWar.addNetworkListeners(gameId, listeners);
		gameWar.sendMessage(gameId, "opengame");
	}

	this.close = function () {
		gameWar.removeNetworkListeners(gameId, listeners);
	};
};