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

	var lastGameData = {};

	var gameStylers = {
		table: function (players, starter) {
			var div = document.createElement("div");
			div.appendChild(document.createTextNode("Players in this game (the green player played the first card on the table): "));
			div.appendChild(document.createElement("br"));
			players.sort(function (a, b) {
				return a.tableposition - b.tableposition;
			});
			for (var key = 0; key < players.length; key++) {
				var button = div.appendChild(style.currentStyle.button(players[key].username + " (" + players[key].points + ")", function (event) {
					gameWar.callEvent("profile", event.target.playerid);
				}));
				if (players[key].tableposition === starter) {
					button.classList.add("default_green_button");
				}
				button.playerid = players[key].id;
				button.style.minWidth = "100px";
				if (key < players.length - 1) {
					div.appendChild(gameStylers.arrow());
				}
			}
			return div;
		},
		cards: function (cards, grouped, text) {
			var div = document.createElement("div");
			div.appendChild(document.createTextNode(text));
			div.appendChild(document.createElement("br"));
			if (grouped) {
				cards.sort(function (a, b) {
					if (a.cardtype % 4 !== b.cardtype % 4) {
						return (a.cardtype % 4) - (b.cardtype % 4);
					} else {
						return Math.floor(a.cardtype / 4) - Math.floor(b.cardtype / 4);
					}
				});
			}
			for (var k = 0; k < cards.length; k++) {
				div.appendChild(gameStylers.card(cards[k].cardtype));
			}
			return div;
		},
		card: function (cardtype) {
			var img = document.createElement("img");
			img.className = "clickable";
			img.alt = cardtype;
			img.style.margin = "5px";
			img.src = "images/hearts/cards/" + cardtype + ".png";
			img.cardtype = cardtype;
			img.addEventListener("click", helpers.cardClick);
			return img;
		},
		arrow: function () {
			var img = document.createElement("img");
			img.src = "images/hearts/arrow.png";
			img.alt = "comes before";
			img.style.verticalAlign = "middle";
			return img;
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
		}.bind(this),
		drawTable: function (gamedata) {
			while (targetdiv.firstChild) {
				targetdiv.removeChild(targetdiv.firstChild);
			}
			
			var handcards = [];
			var passingcards = [];
			var tablecards = [];
			for (var key = 0; key < gamedata.cards.length; key++) {
				if (gamedata.cards[key].position <= gamedata.players.length) {
					handcards.push(gamedata.cards[key]);
				} else if (gamedata.cards[key].position > gamedata.players.length * 3 && gamedata.cards[key].position <= gamedata.players.length * 4) {
					passingcards.push(gamedata.cards[key]);
				} else if (gamedata.cards[key].position > gamedata.players.length * 2 && gamedata.cards[key].position <= gamedata.players.length * 3) {
					tablecards.push(gamedata.cards[key]);
				}
			}
			
			tablecards.sort(function (a, b) {
				return a.position - b.position;
			});

			if (!gamedata.passedcards) {
				for (var key = 0; key < gamedata.players.length; key++) {
					if (gamedata.players[key].id === gameWar.id) {
						var passingTo = ((player.tableposition + gamedata.round) % gamedata.players.length) + 1;
						break;
					}
				}
				
				for (var key = 0; key < gamedata.players.length; key++) {
					if (gamedata.players[key].tableposition === passingTo) {
						var passingTo = gamedata.players[key].username;
					}
				}
			}
			
			var block = targetdiv.appendChild(style.currentStyle.blockText());
			var table = block.appendChild(gameStylers.table(gamedata.players, gamedata.currentstarter));

			if (tablecards.length > 0) {
				block.appendChild(document.createElement("br"));
				var tablecards = block.appendChild(gameStylers.cards(tablecards, false, "Cards on the table: "));
			}
			if (passingcards.length > 0) {
				block.appendChild(document.createElement("br"));
				var passingcards = block.appendChild(gameStylers.cards(passingcards, true, "You are passing the following cards. Once everyone has selected 3 cards they will be passed and the game begins."));
			}
			if (handcards.length > 0) {
				block.appendChild(document.createElement("br"));
				var text = "Click on the card " + ((gamedata.passedcards) ? "that you want to play." : "that you want to pass to someone else. You are passing cards to " + passingTo);
				var handcards = block.appendChild(gameStylers.cards(handcards, true, "These are you handcards. " + text));
			}
		},
		cardClick: function (event) {
			gameWar.sendMessage(gameId, "card", event.target.cardtype);
		}
	};

	if (typeof gameId === "number") {
		while (targetdiv.firstChild) {
			targetdiv.removeChild(targetdiv.firstChild);
		}
		var listeners = {
			gamelobby: function (data) {
				helpers.showLobby(data);
			}.bind(this),
			gamedata: function (data) {
				helpers.drawTable(data);
				lastGameData = data;
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