var gameWarGames = gameWarGames || {};
gameWarGames.Hearts = function Hearts (gameId, targetdiv, gameWar) {
	this.description = "<div class=\"default_label\">Hearts (black lady) game.</div><br/> Hearts is a game where the goal is to have as little points as possible. The person with the least points when one of the players reaches 'End points' is the winner. <br/><br/> Every player is given 13 cards. Each players gives another player (who depends on the round) 3 of their own cards and receives 3 cards from someone. The player with clubs 2 is the first player to lay a card on the table. Then it is played in order. <br/><br/> Everyone lays a card on the table that has to match the type of the card that was first laid on the table unless a player can't do that, then they are free to choose any card they want.<br/><br/> When all players have put a card on the table the person with the highest card of the kind that was first laid has to take the four cards with him and has to play a new cards out of hes hand which cannot be one of the heart types unless someone already laid it or if the player doesn't have another card.<br/><br/> When everyone has laid all their cards, every player gets a score added to their points. Every heart card is one point and the spades lady is worth 13. After that a new round begins untill someone has a score of 'End points'.";
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
	var errorDiv, successDiv;

	var gameStylers = {
		table: function (players, green) {
			var div = document.createElement("div");
			div.appendChild(document.createTextNode("Players in this game: "));
			div.appendChild(document.createElement("br"));
			players.sort(function (a, b) {
				return a.tableposition - b.tableposition;
			});
			for (var key = 0; key < players.length; key++) {
				var button = div.appendChild(style.currentStyle.button(players[key].username + " (" + players[key].points + ")", function (event) {
					gameWar.callEvent("profile", event.target.playerid);
				}));
				if (players[key].tableposition === green) {
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
		cards: function (cards, grouped, text, clickable) {
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
				div.appendChild(gameStylers.card(cards[k].cardtype, clickable));
			}
			return div;
		},
		card: function (cardtype, clickable) {
			var img = document.createElement("img");
			img.alt = cardtype;
			img.style.margin = "5px";
			img.src = "images/hearts/cards/" + cardtype + ".png";
			img.cardtype = cardtype;
			if (clickable) {
				img.addEventListener("click", helpers.cardClick);
				img.className = "clickable";
			}
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
			console.log("Lobby data:", data);
			while (targetdiv.firstChild) {
				targetdiv.removeChild(targetdiv.firstChild);
			}
			errorDiv = targetdiv.appendChild(document.createElement("div"));
			successDiv = targetdiv.appendChild(document.createElement("div"));
			targetdiv.appendChild(style.currentStyle.lobby(this, data, gameWar, gameId));
		}.bind(this),
		drawTable: function (gamedata) {
			while (targetdiv.firstChild) {
				targetdiv.removeChild(targetdiv.firstChild);
			}
			for (var key = 0; key < gamedata.players.length; key++) {
				if (gamedata.players[key].points >= gamedata.endpoints) {
					var lowest = gamedata.players[key].points,
						winners = [];
					for (var key = 0; key < gamedata.players.length; key++) {
						if (gamedata.players[key].points >= gamedata.endpoints) {
							if (gamedata.players[key].points < lowest) {
								lowest = gamedata.players[key].points;
								winners = [gamedata.players[key].username];
							} else if (gamedata.players[key].points === lowest) {
								winners.push(gamedata.players[key].username);
							}
						}
					}
					var block = targetdiv.appendChild(style.currentStyle.blockText());
					block.appendChild(document.createTextNode("This game has been ended already. " + winners.join(" and ") + " won the game."));
					return;
				}
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

			var passingTo = {};
			if (!gamedata.passedcards) {
				for (var key = 0; key < gamedata.players.length; key++) {
					if (gamedata.players[key].id === gameWar.userId) {
						passingTo = ((gamedata.players[key].tableposition + gamedata.round) % gamedata.players.length) + 1;
						break;
					}
				}
				
				for (var key = 0; key < gamedata.players.length; key++) {
					if (gamedata.players[key].tableposition === passingTo) {
						passingTo = gamedata.players[key];
						break;
					}
				}
			}
			
			var greenplayer = passingTo.tableposition || helpers.whoHasToPlay(gamedata, tablecards);

			var block = targetdiv.appendChild(style.currentStyle.blockText());
			errorDiv = block.appendChild(document.createElement("div"));
			successDiv = block.appendChild(document.createElement("div"));
			var table = block.appendChild(gameStylers.table(gamedata.players, greenplayer));

			for (var key = 0; key < gamedata.players.length; key++) {
				if (gamedata.players[key].tableposition === greenplayer) {
					var currentplayer = gamedata.players[key];
				}
			}

			if (tablecards.length > 0) {
				block.appendChild(document.createElement("br"));
				var tablecards = block.appendChild(gameStylers.cards(tablecards, false, "Cards on the table: "));
			}
			if (passingcards.length > 0) {
				block.appendChild(document.createElement("br"));
				var passingcards = block.appendChild(gameStylers.cards(passingcards, true, "You are passing the following cards. Once everyone has selected 3 cards they will be passed and the game begins.", true));
			}
			if (handcards.length > 0) {
				block.appendChild(document.createElement("br"));
				var text = "These are your handcards.";
				if (!gamedata.passedcards) {
					text += " Click on the card that you want to pass to someone else. You are passing cards to " + passingTo.username + ".";
					if  (passingcards.length < 3) {
						tabview.requestAttention(targetdiv);
					}
				} else if (gameWar.userId === currentplayer.id) {
					text += " Click on the card that you want to play.";
					tabview.requestAttention(targetdiv);
				}
				var handcards = block.appendChild(gameStylers.cards(handcards, true, text, !gamedata.passedcards || gameWar.userId === currentplayer.id));
			}
		},
		cardClick: function (event) {
			gameWar.sendMessage(gameId, "card", event.target.cardtype);
		},
		whoHasToPlay: function (gamedata, tablecards) {
			if (gamedata.players.length === tablecards.length) {
				gamedata.highestPlayedCard = gamedata.highestPlayedCard || helpers.highestPlayedCard(gamedata, tablecards);
				return (gamedata.currentstarter + (gamedata.highestPlayedCard.position % gamedata.players.length || gamedata.players.length) - 1) % gamedata.players.length || gamedata.players.length;
			}
			return (gamedata.currentstarter + tablecards.length) % gamedata.players.length || gamedata.players.length;
		},
		highestPlayedCard: function (gamedata, tablecards) {
			var highest = helpers.firstPlayedCard(tablecards, gamedata);
				firstCardKind = highest.cardtype % 4;
			for (var key = 0; key < tablecards.length; key++) {
				if (tablecards[key].cardtype % 4 === firstCardKind && tablecards[key].cardtype > highest.cardtype) {
					highest = tablecards[key];
				}
			}
			return highest;
		},
		firstPlayedCard: function (tablecards, gamedata) {
			for (var key = 0; key < tablecards.length; key++) {
				if (tablecards[key].position === gamedata.players.length * 2 + 1) {
					return tablecards[key];
				}
			}
			return false;
		}
	};
	
	this.kickPlayer = function (playerId) {
		gameWar.sendMessage(gameId, "kick", playerId);
	};

	if (typeof gameId === "number") {
		while (targetdiv.firstChild) {
			targetdiv.removeChild(targetdiv.firstChild);
		}
		var listeners = {
			gamelobby: function (data) {
				helpers.showLobby(data);
				tabview.requestAttention(targetdiv);
			}.bind(this),
			gamedata: function (data) {
				helpers.drawTable(data);
				lastGameData = data;
				console.log(data);
			}.bind(this),
			error: function (error) {
				if (errorDiv) {
					while (errorDiv.firstChild) {
						errorDiv.removeChild(errorDiv.firstChild);
					}
					errorDiv.appendChild(style.currentStyle.error(error));
				}
				tabview.requestAttention(targetdiv);
			},
			success: function (success) {
				if (successDiv) {
					while (successDiv.firstChild) {
						successDiv.removeChild(successDiv.firstChild);
					}
					successDiv.appendChild(style.currentStyle.success(success));
				}
				tabview.requestAttention(targetdiv);
			}
		};
		gameWar.addNetworkListeners(gameId, listeners);
		gameWar.sendMessage(gameId, "opengame");
	}

	this.close = function () {
		gameWar.removeNetworkListeners(gameId, listeners);
	};
};