var style = {
	"default": {
		button: function (text, callback) {
			var button = document.createElement("div");
			button.appendChild(document.createTextNode(text));
			button.className = "default_button";
			button.addEventListener("click", callback);
			button.addEventListener("dblclick", function (event) {
				event.preventDefault();
			});
			return button;
		},
		label: function (text) {
			var label = document.createElement("div");
			label.className = "default_label";
			label.appendChild(document.createTextNode(text));
			return label;
		},
		gamelabel: function (text) {
			var label = this.label(text);
			label.style.marginRight = "30px";
			return label;
		},
		input: function (type, placeholder) {
			var input = document.createElement("input");
			input.type = type;
			input.className = "default_input";
			input.placeholder = placeholder || "";
			return input;
		},
		labeledInput: function (type, labelText, placeholder) {
			var label = this.label(labelText);
			var input = this.input(type, labelText || placeholder);
			return {
				label: label, 
				input: input
			};
		},
		blockText: function () {
			var blocktext = document.createElement("div");
			blocktext.className = "default_blocktext";
			return blocktext;
		},
		gameButton: function (game, games, callback) {
			if (typeof callback !== "function") {
				if (typeof callback.callEvent === "function") {
					var gameWar = callback;
					callback = function () {
						gameWar.callEvent("game", game.id);
					};
				} else {
					callback = function () {};
				}
			}
			
			var button = document.createElement("div");
			button.className = "default_button";
			button.style.display = "block";
			button.style.minWidth = "200px";
			button.addEventListener("click", callback);
			button.appendChild(this.gamelabel("Gamename: " + games[game.name].name));
			button.appendChild(this.gamelabel("Started by: " + game.creatorname));
			button.appendChild(this.gamelabel("Players: " + ((typeof game.currentplayercount === "number") ? game.currentplayercount + "/" : "") + game.maxplayers));
			button.appendChild(this.gamelabel("Bet amount: " + game.betamount));
			button.appendChild(document.createElement("br"));
			for (var key in game.settings) {
				if (key === "players" || key === "betAmount") {
					continue;
				}
				button.appendChild(this.gamelabel(games[game.name].settings[key].label + ": " + game.settings[key]));
			}
			return button;
		},
		gameList: function (gameWar, gamelist) {
			var list = document.createElement("div");
			for (var key = 0; key < gamelist.length; key++) {
				gameWar.loadGame(gamelist[key].name, (function (game) {
					return function () {
						var button = list.appendChild(this.gameButton(game, gameWar.exampleGames, gameWar));
					}.bind(this)
				}.bind(this))(gamelist[key]));
			}
			if (gamelist.length === 0) {
				list.appendChild(document.createElement("br"));
				list.appendChild(document.createTextNode("There are no games to be listed here."));
			}
			return list;
		},
		lobbyPlayerList: function (gameWar, gameData, game) {
			var playerlist = document.createElement("div");
			playerlist.className = "default_lobby_block";
			playerlist.appendChild(document.createTextNode("Players (" + gameData.players.length + "/" + gameData.maxPlayers + "):"));
			playerlist.appendChild(document.createElement("br"));
			for (var key = 0; key < gameData.players.length; key++) {
				playerlist.appendChild(document.createElement("br"));
				var text = gameData.players[key].username + " [" + gameData.players[key].id + "]";
				if (gameData.players[key].id === gameData.creatorId) {
					text += " (Creator)";
				}
				var button = playerlist.appendChild(this.button(text, function (event) {
					gameWar.callEvent("profile", event.target.playerId);
				}));
				button.playerId = gameData.players[key].id;
				button.style.minWidth = "76%";
				button.style.margin = "3px";
				if (game) {
					playerlist.appendChild(this.kickPlayerButton(game, gameData.players[key].id));
				}
			}
			return playerlist
		},
		kickPlayerButton: function (game, playerId) {
			var button = document.createElement("div");
			button.addEventListener("click", function (event) {
				game.kickPlayer(event.target.playerId);
			});
			button.playerId = playerId;
			button.className = "default_kick_button";
			button.appendChild(document.createTextNode("X"));
			return button;
		},
		lobbySettingsList: function (gameData, settingList) {
			var settingslist = document.createElement("div");
			settingslist.className = "default_lobby_block";
			settingslist.appendChild(document.createTextNode("Gamesettings:"));
			settingslist.appendChild(document.createElement("br"));
			settingslist.appendChild(document.createElement("br"));
			for (var key in gameData.settings) {
				settingslist.appendChild(this.label(settingList[key].label));
				settingslist.appendChild(document.createElement("br"));
				settingslist.appendChild(document.createTextNode(gameData.settings[key]));
				settingslist.appendChild(document.createElement("br"));
				settingslist.appendChild(document.createElement("br"));
			}
			return settingslist;
		},
		lobbyBlock: function () {
			var block = document.createElement("div")
			block.className = "default_lobby_block";
			return block;
		},
		walletTable: function (satoshi) {
			var table = document.createElement("table");
			table.classList.add("default_wallettable");
			var denominations = {
				BTC: 1e8,
				mBTC: 1e6,
				satoshi: 1
			};
			for (var denomination in denominations) {
				var row = table.insertRow(-1);
				var denominationcell = row.insertCell(-1);
				denominationcell.appendChild(document.createTextNode(denomination));
				denominationcell.classList.add("default_denominationcell");
				var valuecell = row.insertCell(-1);
				valuecell.appendChild(document.createTextNode(satoshi / denominations[denomination]));
				valuecell.classList.add("default_valuecell");
			}
			return table;
		},
		gameFundTable: function (gameFunds) {
			
		},
		transactionsTable: function (transactions) {
			
		},
		error: function (error) {
			var errorDiv = document.createElement("div");
			errorDiv.appendChild(document.createTextNode(error));
			errorDiv.className = "default_error_message";
			return errorDiv;
		},
		success: function (success) {
			var successDiv = document.createElement("div");
			successDiv.appendChild(document.createTextNode(success));
			successDiv.className = "default_success_message";
			return successDiv;
		}
	}
};
style.currentStyle = style.default;