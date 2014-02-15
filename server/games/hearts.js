module.exports = function Hearts (mysql, messages, settings, gameFunds) {
	settings = settings || {};
	settings.cachetime = settings.cachetime || 1500;
	this.name = "Hearts (black lady)";
	this.games = {};
	this.settings = {
		players: {
			type: "number",
			input: {
				min: 3,
				max: 5
			}
		},
		endPoints: {
			type: "number",
			input: {
				min: 0,
				max: 300
			}
		},
		betAmount: {
			type: "number",
			input: {
				min: 0,
				max: Infinity
			}
		},
		maxDecisionTime: {
			type: "number",
			input: {
				min: 0,
				max: 2880,
			}
		}
	};
	
	/*
		Card types:
			0 -> 51
				Type: x % 4
					0:		Hearts
					1:		Spades
					2:		Diamonds
					3:		Clubs
				Number: Math.floor(x / 4)				Note: Every cards number is 2 units lower than it's face value because it is 0-indexed and A is the last card
		Card positions:
			0											Not yet shuffled
			1 -> max_players 							Hand of that player
			max_players + 1 -> max_players * 2			Pointcontainer of that player
			max_players * 2 + 1 -> max_players * 3		Table at position: x - max_players * 2
			max_players * 3 + 1	-> max_players * 4		Cards that want to be passed, cards from player
			13, 14, 15, 16
			13, 14, 15, 16
			1, 2, 3, 0
			1, 2, 3, 1
		gamedata:
			- maxplayers: INT
			- cards: ARRAY of cards
			- tablecards: ARRAY of cards on the table
	*/
	
	var gameListeners = {};
	var helpers = {
		createDatabase: function () {
			if (settings.dropTables) {
				mysql.query("DROP TABLE games_hearts_cards");
				mysql.query("DROP TABLE games_hearts_playerdata");
				mysql.query("DROP TABLE games_hearts_gamedata");
			}
			var query = "CREATE TABLE IF NOT EXISTS ";
			query += "games_hearts_cards (";
			query += "`gameid` bigint NOT NULL,";
			query += "`cardtype` int NOT NULL,";
			query += "`position` int NOT NULL,";
			query += "PRIMARY KEY (gameid, cardtype)";
			query += ")";
			mysql.query(query);
			var query = "CREATE TABLE IF NOT EXISTS ";
			query += "games_hearts_playerdata (";
			query += "`gameid` bigint NOT NULL,";
			query += "`playerid` bigint NOT NULL,";
			query += "`tableposition` int NOT NULL,";
			query += "`points` int NOT NULL DEFAULT 0,";
			query += "PRIMARY KEY (gameid, playerid)";
			query += ")";
			mysql.query(query);
			var query = "CREATE TABLE IF NOT EXISTS ";
			query += "games_hearts_gamedata (";
			query += "`gameid` bigint NOT NULL,";
			query += "`currentstarter` bigint NOT NULL DEFAULT 0,";
			query += "`passedcards` int NOT NULL DEFAULT 0,";
			query += "`brokenhearts` int NOT NULL DEFAULT 0,";
			query += "`round` int NOT NULL DEFAULT 0,";
			query += "PRIMARY KEY (gameid)";
			query += ")";
			mysql.query(query);
		},
		getGameLobbyData: function (gameId, callback, forceUpdate) {
			if (this.games[gameId] && Date.now() - this.games[gameId].lastUpdated <= settings.cacheTime && !this.games[gameId].outdated && !forceUpdate) {
				callback(this.games[gameId]);
			} else {
				mysql.query("SELECT creatorId, maxPlayers, betAmount FROM games_lobby WHERE id = " + mysql.escape(gameId), function (err, games_lobby, fields) {
					if (err) {
						console.log("Database error: Game Hearts: SELECT games_lobby gameID = " + gameId + " ERR:" + err);
						return;
					}
					mysql.query("SELECT settingname, value FROM games_settings WHERE gameid = " + mysql.escape(gameId), function (err, games_settings, fields) {
						if (err) {
							console.log("Database error: Game Hearts: SELECT games_settings gameID = " + gameId + " ERR:" + err);
							return;
						}
						mysql.query("SELECT id, username FROM games_players INNER JOIN users ON games_players.playerid = users.id WHERE gameid = " + mysql.escape(gameId), function (err, games_players, fields) {
							if (err) {
								console.log("Database error: Game Hearts: SELECT games_settings gameID = " + gameId + " ERR:" + err);
								return;
							}
							if (games_lobby.length > 0) {
								this.games[gameId] = games_lobby[0];
								var settings = {};
								for (var key = 0; key < games_settings.length; key++) {
									settings[games_settings[key].settingname] = games_settings[key].value;
								}
								this.games[gameId].settings = settings;
								this.games[gameId].players = games_players;
								callback(this.games[gameId]);
							} else {
								console.log(gameId + " doesn't exist.");
							}
						}.bind(this));
					}.bind(this));
				}.bind(this));
			}
		}.bind(this),
		removePlayer: function (gameId, playerId, callback) {
			mysql.query("DELETE FROM games_players WHERE gameid = " + mysql.escape(gameId) + " AND playerid = " + mysql.escape(playerId), function (err, rows, fields) {
				if (err) {
					console.log("GAMES: HEARTS: DATABASE JOIN ERROR: " + err);
					callback(err);
					return;
				}
				callback();
			});
		},
		addGameListener: function (gameId, socket) {
			gameListeners[gameId] = gameListeners[gameId] || [];
			if (gameListeners[gameId].indexOf(socket) === -1) {
				gameListeners[gameId].push(socket);
			}
		},
		removeGameListener: function (socket) {
			for (var gameId in gameListeners) {
				var index = gameListeners[gameId].indexOf(socket);
				if (index !== -1) {
					gameListeners[gameId].splice(index, 1);
				}
			}
		},
		callGameListeners: function (gameId, event, data) {
			gameListeners[gameId] = gameListeners[gameId] || {};
			for (var key = 0; key < gameListeners[gameId].length; key++) {
				messages.emit(gameListeners[gameId][key], gameId, event, data);
			}
		},
		sendGameData: function (gameId, socket) {
			gameListeners[gameId] = gameListeners[gameId] || [];
			mysql.query("SELECT cardtype, position FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, cards, fields) {
				if (err) {
					console.log("SENDGAMEDATA DATABASE ERROR GET CARDS: " + err);
					if (socket) {
						messages.emit(socket, gameId, "error", "Can't send gamedata, database error: " + err);
					}
					return;
				}
				mysql.query("SELECT id, username, tableposition, points FROM games_hearts_playerdata INNER JOIN users ON games_hearts_playerdata.playerid = users.id WHERE gameid = " + mysql.escape(gameId), function (err, players, fields) {
					if (err) {
						console.log("SENDGAMEDATA DATABASE ERROR GET PLAYERS: " + err);
						if (socket) {
							messages.emit(socket, gameId, "error", "Can't send gamedata, database error: " + err);
						}
						return;
					}
					mysql.query("SELECT (SELECT value FROM games_settings WHERE gameid = " + mysql.escape(gameId) + " AND settingname = 'endPoints') AS endpoints, currentstarter, brokenhearts, passedcards, round FROM games_hearts_gamedata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
						if (err) {
							console.log("SENDGAMEDATA DATABASE ERROR GET GAMEDATA: " + err);
							if (socket) {
								messages.emit(socket, gameId, "error", "Can't send gamedata, database error: " + err);
							}
							return;
						}
						if (socket) {
							messages.emit(socket, gameId, "gamedata", helpers.prepareGameData(socket.userdata.id, gamedata[0], players, cards));
						} else {
							for (var key = 0; key < gameListeners[gameId].length; key++) {
								messages.emit(gameListeners[gameId][key], gameId, "gamedata", helpers.prepareGameData(gameListeners[gameId][key].userdata.id, gamedata[0], players, cards));
							}
						}
					});
				});
			});
		},
		prepareGameData: function (playerId, gamedata, players, cards) {
			var playerpos = 0;
			for (var k = 0; k < players.length; k++) {
				if (players[k].id === playerId) {
					playerpos = players[k].tableposition;
				}
			}
			gamedata.players = players;
			gamedata.cards = helpers.cardsAllowedToBeViewed(cards, playerpos, players.length);
			return gamedata;
		},
		cardsAllowedToBeViewed: function (cards, playerpos, playeramount) {
			var viewcards = [];
			for (var k = 0; k < cards.length; k++) {
				if (cards[k].position === playerpos || (cards[k].position > playeramount * 2 && cards[k].position <= playeramount * 3) || (cards[k].position > playeramount * 3 && (cards[k].position % playeramount) === playerpos % playeramount)) {
					viewcards.push(cards[k]);
				}
			}
			return viewcards;
		},
		newCardArray: function (players) {
			var cards = [];
			var exclude = [];
			if (players === 5) {
				exclude.push(10);
				exclude.push(15);
			} else if (players === 3) {
				exclude.push(10);
			}
			for (var i = 0; i < 52; i++) {
				if (exclude.indexOf(i) !== -1) {
					continue;
				}
				cards.push({
					cardtype: i,
					position: 0
				});
			}
			return cards;
		},
		shuffleArray: function (array) {
				var counter = array.length, temp, index;
				while (counter > 0) {
					index = Math.floor(Math.random() * counter);
					counter--;
					temp = array[counter];
					array[counter] = array[index];
					array[index] = temp;
				}
				return array;
		},
		shuffleCardArray: function (cards, players) {
			cards = helpers.shuffleArray(cards);
			for (var i = 0; i < cards.length; i++) {
				cards[i].position = i % players + 1;
			}
			return cards;
		},
		saveCards: function (gameId, cards, callback) {
			callback = callback || function () {};
			if (typeof gameId !== "number" || !cards || cards.length === 0) {
				console.log("Tried saving cards to a gameId that wasn't a number or the cards weren't specified GAMEID: " + gameId + " CARDS ARRAY: ", cards);
				return;
			}
			mysql.query("SELECT count(*) AS cardamount FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, rows, fields) {
				if (!rows[0].cardamount !== cards.length) {
					mysql.query("DELETE FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId));
					var values = [];
					for (var key = 0; key < cards.length; key++) {
						values.push("(" + mysql.escape(gameId) + ", " + mysql.escape(cards[key].cardtype) + ", " + mysql.escape(cards[key].position) + ")");
					}
					mysql.query("INSERT INTO games_hearts_cards VALUES " + values.join(", "), function (err, rows, fields) {
						if (err) {
							console.log("ERROR INSERTING CARDS ERR: " + err);
							return;
						}
						callback();
					});
				} else {
					var ids = [];
					var whens = "";
					for (var key = 0; key < cards.length; key++) {
						ids.push(mysql.escape(cards[key].cardtype));
						whens += " WHEN " + cards[key].cardtype + " THEN " + cards[key].position;
					}
					mysql.query("UPDATE games_hearts_cards SET position = CASE cardtype" + whens + " END CASE WHERE gameId = " + mysql.escape(gameId) + " AND cardtype IN (" + ids.join(", ") + ")", function (err, rows, fields) {
						if (err) {
							console.log("ERROR UPDATING CARDS ERR: " + err);
							return;
						}
						callback();
					});
				}
			});
			return cards;
		},
		startNewGameRound: function (gameId) {
			mysql.query("SELECT maxPlayers FROM games_lobby WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
				var cards = helpers.saveCards(gameId, helpers.shuffleCardArray(helpers.newCardArray(rows[0].maxPlayers), rows[0].maxPlayers), function () {
					helpers.playFirstCard(gameId);
					helpers.sendGameData(gameId);
				});
			});
		},
		passCard: function (gameId, playerId, cardtype, socket) {
			mysql.query("SELECT playerid, tableposition FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, players, fields) {
				if (err) {
					console.log("ERROR SELLECTING PLAYERDATA ON CARD ERR: " + err);
					messages.emit(socket, gameId, "error", err + "");
					return;
				}
				for (var key = 0; key < players.length; key++) {
					if (players[key].playerid === playerId) {
						var player = players[key];
					}
				}
				mysql.query("SELECT cardtype, position FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, cards, fields) {
					if (err) {
						console.log("ERROR SELECTING CARDS ON CARD ERR: " + err);
						messages.emit(socket, gameId, "error", err + "");
						return;
					}
					var passingcards = [];
					for (var key = 0; key < cards.length; key++) {
						if (cards[key].cardtype === cardtype && cards[key].position !== player.tableposition) {
							if (cards[key].position === players.length * 3 + player.tableposition) {
								mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(player.tableposition) + " WHERE gameid = " + mysql.escape(gameId) + " AND cardtype = " + mysql.escape(cardtype), function (err, rows, fields) {
									if (err) {
										console.log("GAMES: HEARTS: PASSCARD DATABASE ERROR SET POSTION BACK TO HANDCARD ERR: " + err);
										messages.emit(socket, gameId, "error", "There was a database error.");
										return;
									}
									helpers.sendGameData(gameId, socket);
								});
								return;
							} else if (cards[key].position !== player.tableposition) {
								messages.emit(socket, gameId, "error", "This card isn't in your hand so you can't pass it.");
								return;
							}
						}
						if (cards[key].position > players.length * 3 && cards[key].position <= players.length * 4 && cards[key].position % players.length === player.tableposition) {
							passingcards.push(cards[key]);
						}
					}
					if (passingcards.length > 2) {
						messages.emit(socket, gameId, "error", "You have already selected 3 cards to pass.");
					} else {
						mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(players.length * 3 + player.tableposition) + " WHERE gameid = " + mysql.escape(gameId) + " AND cardtype = " + mysql.escape(cardtype));
						helpers.sendGameData(gameId, socket);
						helpers.playFirstCard(gameId);
					}
				});
			});
		},
		playCard: function (gameId, playerId, cardtype, socket) {
			mysql.query("SELECT (SELECT count(*) FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId) + ") as maxplayers, games_hearts_gamedata.currentstarter, games_hearts_gamedata.brokenhearts, games_hearts_playerdata.tableposition FROM games_hearts_playerdata INNER JOIN games_hearts_gamedata ON games_hearts_playerdata.gameid = games_hearts_gamedata.gameid WHERE games_hearts_gamedata.gameid = " + mysql.escape(gameId) + " AND games_hearts_playerdata.playerid = " + mysql.escape(playerId), function (err, player, fields) {
				if (err) {
					console.log("GAMES: HEARTS: DATABASE ERRRO SELECT MAXPLAYERS PLAYCARD ERR: " + err);
					messages.emit(socket, gameId, "error", "DATABASE ERROR: " + err);
					return;
				}
				player = player[0];
				var gamedata = player;
				mysql.query("SELECT cardtype, position FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, cards, fields) {
					if (err) {
						messages.emit(socket, gameId, "error", "DATABASE ERROR: " + err);
						console.log("GAMES: HEARTS: PLAYCARD DATABASE ERROR SELECTING CARDS ERR: " + err);
						return;
					}
					var tablecards = helpers.tableCards(gamedata, cards);
					var nextposition = gamedata.maxplayers * 2 + 1 + tablecards.length % gamedata.maxplayers;
					var whoHasToPlay = helpers.whoHasToPlay(gamedata, tablecards);
					if (player.tableposition !== whoHasToPlay) {
						messages.emit(socket, gameId, "error", "It is not currently your turn!");
						return;
					}
					if (player.tableposition !== helpers.cardOwner(cardtype, gamedata, cards)) {
						messages.emit(socket, gameId, "error", "You don't have this card!");
						return;
					}
					if (!helpers.isLegalMove(cardtype, player.tableposition, gamedata, cards, tablecards)) {
						messages.emit(socket, gameId, "error", "That is not a valid move.");
						return;
					}
					if (tablecards.length === gamedata.maxplayers) {
						mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(gamedata.maxplayers + whoHasToPlay) + " WHERE gameid = " + mysql.escape(gameId) + " AND position > " + mysql.escape(gamedata.maxplayers * 2) + " AND position <= " + mysql.escape(gamedata.maxplayers * 3));
						mysql.query("UPDATE games_hearts_gamedata SET currentstarter = " + mysql.escape(whoHasToPlay) + " WHERE gameid = " + mysql.escape(gameId));
					}
					if (tablecards.length === gamedata.maxplayers - 1) {
						var lastcard = true;
						for (var key = 0; key < cards.length; key++) {
							if (cards[key].position <= gamedata.maxplayers && cards[key].cardtype !== cardtype) {
								lastcard = false;
								break;
							}
						}
					}
					if (cardtype % 4 === 0) {
						mysql.query("UPDATE games_hearts_gamedata SET brokenhearts = 1 WHERE gameid = " + mysql.escape(gameId));
					}
					mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(nextposition) + " WHERE gameid = " + mysql.escape(gameId) + " AND cardtype = " + mysql.escape(cardtype));
					helpers.sendGameData(gameId);
					if (lastcard) {
						tablecards.push({cardtype: cardtype, position: nextposition});
						var whoHasToPlay = helpers.whoHasToPlay(gamedata, tablecards);
						mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(gamedata.maxplayers + whoHasToPlay) + " WHERE gameid = " + mysql.escape(gameId) + " AND position > " + mysql.escape(gamedata.maxplayers * 2) + " AND position <= " + mysql.escape(gamedata.maxplayers * 3));
						helpers.roundEnded(gameId);
					}
				});
			});
		},
		cardOwner: function (cardtype, gamedata, cards) {
			for (var key = 0; key < cards.length; key++) {
				if (cards[key].cardtype === cardtype) {
					if (cards[key].position > gamedata.maxplayers || cards[key].position === 0) {
						return false;
					}
					return cards[key].position % gamedata.maxplayers || gamedata.maxplayers;
				}
			}
			return false;
		},
		tableCards: function (gamedata, cards) {
			var tablecards = [];
			for (var key = 0; key < cards.length; key++) {
				if (cards[key].position > gamedata.maxplayers * 2 && cards[key].position <= gamedata.maxplayers * 3) {
					tablecards.push(cards[key]);
				}
			}
			return tablecards;
		},
		whoHasToPlay: function (gamedata, tablecards) {
			if (gamedata.maxplayers === tablecards.length) {
				gamedata.highestPlayedCard = gamedata.highestPlayedCard || helpers.highestPlayedCard(gamedata, tablecards);
				return (gamedata.currentstarter + (gamedata.highestPlayedCard.position % gamedata.maxplayers || gamedata.maxplayers) - 1) % gamedata.maxplayers || gamedata.maxplayers;
			}
			return (gamedata.currentstarter + tablecards.length) % gamedata.maxplayers || gamedata.maxplayers;
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
		isLegalMove: function (cardtype, tableposition, gamedata, cards, tablecards) {
			if (!tablecards) {
				tablecards = helpers.tableCards(gamedata, cards);
			}
			var firstKind = helpers.firstPlayedCard(tablecards, gamedata).cardtype % 4;
			if (tablecards.length === gamedata.maxplayers) {
				if (!gamedata.brokenhearts && cardtype % 4 === 0) {
					for (var key = 0; key < cards.length; key++) {
						if (cards[key].position === tableposition && cards[key].cardtype % 4 !== 0) {
							return false;
						}
					}
				}
				return true;
			}
			if (firstKind !== cardtype % 4) {
				for (var key = 0; key < cards.length; key++) {
					if (cards[key].position === tableposition && cards[key].cardtype % 4 === firstKind) {
						return false;
					}
				}
			}
			return true;
		},
		firstPlayedCard: function (tablecards, gamedata) {
			for (var key = 0; key < tablecards.length; key++) {
				if (tablecards[key].position === gamedata.maxplayers * 2 + 1) {
					return tablecards[key];
				}
			}
			return false;
		},
		passAllCards: function (gameId, callback) {
			mysql.query("SELECT count(*) AS playercount FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, rows, fields) {
				if (err) {
					console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO SELECT PLAYERCOUNT FOR PASSALLCARDS ERR: " + err);
					return;
				}
				mysql.query("SELECT round FROM games_hearts_gamedata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
					if (err) {
						console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO SELECT ROUND FOR PASSALLCARDS ERR: " + err);
						return;
					}
					mysql.query("UPDATE games_hearts_cards SET position = ((position + " + mysql.escape(gamedata[0].round) + ") % " + mysql.escape(rows[0].playercount) + ") + 1 WHERE gameid = " + mysql.escape(gameId) + " AND position > " + mysql.escape(rows[0].playercount * 3) + " AND position <= " + mysql.escape(rows[0].playercount * 4), function (err, row, fields) {
						if (err) {
							console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO PASSALLCARDS ERR: " + err);
							return;
						}
						mysql.query("UPDATE games_hearts_gamedata SET passedcards = 1 WHERE gameid = " + mysql.escape(gameId), function () {
							if (err) {
								console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO SET PASSEDCARDS TO ONE PASSALLCARDS ERR: " + err);
								return;
							}
							callback();
						});
					});
				});
			});
		},
		playFirstCard: function (gameId) {
			mysql.query("SELECT round FROM games_hearts_gamedata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
				mysql.query("SELECT count(*) AS playercount FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, rows, fields) {
					if (err) {
						console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO SEE IF EVERYONE PASSED A CARD AND SELECTING PLAYERCOUNT ERR: " + err);
						return;
					}
					if (!((gamedata[0].round + 1) % rows[0].playercount)) {
						helpers.playFirstCardChecked(gameId);
					}
					mysql.query("SELECT count(*) AS cardcount FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId) + " AND position > " + mysql.escape(rows[0].playercount * 3) + " AND position <= " + mysql.escape(rows[0].playercount * 4), function (err, cards, fields) {
						if (err) {
							console.log("GAMES: HEARTS: DATABASE ERROR WHILE TRYING TO SEE IF EVERYONE PASSED A CARD ERR: " + err);
							return;
						}
						if (cards[0].cardcount === rows[0].playercount * 3) {
							helpers.playFirstCardChecked(gameId);
						}
					});
				});
			});
		},
		playFirstCardChecked: function (gameId) {
			helpers.passAllCards(gameId, function () {
				mysql.query("SELECT count(*) AS playercount FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
					if (err) {
						console.log("HEARTS: DATABASE ERROR SELECTING PLAYERCOUNT FOR PLAYFIRSTCARDCHECKED ERR: " + err);
						return;
					}
					mysql.query("SELECT position FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId) + " AND cardtype = 3", function (err, rows, fields) {
						if (err) {
							console.log("HEARTS: DATABASE ERROR SELECTING THE ONE WITH STARTCARD AT PLAYFIRSTCARDCHECKED ERR: " + err);
							return;
						}
						mysql.query("UPDATE games_hearts_gamedata SET currentstarter = " + mysql.escape(rows[0].position) + " WHERE gameid = " + mysql.escape(gameId), function (err) {
							if (err) {
								console.log("HEARTS: DATABASE ERROR UPDATING CURRENTSTARTER AT PLAYFIRSTCARDCHECKED ERR: " + err);
								return;
							}
							mysql.query("UPDATE games_hearts_cards SET position = " + mysql.escape(gamedata[0].playercount * 2 + 1) + " WHERE gameid = " + mysql.escape(gameId) + " AND cardtype = 3", function (err) {
								if (err) {
									console.lgo("HEARTS: DATABASE ERROR UPDATING POSITION OF CARDTYPE 3 ERR: " + err);
									return;
								}
								helpers.sendGameData(gameId);
							});
						});
					});
				});
			});
		},
		roundEnded: function (gameId) {
			mysql.query("SELECT cardtype, position FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, cards, fields) {
				if (err) {
					console.log("GAMES: HEARTS: DATABASE ERROR ROUNDENDED SELECTING CARDS: " + err);
					return;
				}
				mysql.query("SELECT count(*) AS maxplayers FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
					if (err) {
						console.log("GAMES: HEARTS: DATABASE ERROR ROUNDENDED SELECT PLAYERCOUNT: " + err);
						return;
					}
					gamedata = gamedata[0];
					var points = {};
					for (var key = 0; key < cards.length; key++) {
						if (cards[key].cardtype % 4 === 0) {
							var tableposition = cards[key].position % gamedata.maxplayers || gamedata.maxplayers;
							points[tableposition] = points[tableposition] || 0;
							points[tableposition]++;
						} else if (cards[key].cardtype === 41) {
							var tableposition = cards[key].position % gamedata.maxplayers || gamedata.maxplayers;
							points[tableposition] = points[tableposition] || 0;
							points[tableposition] += 13;
						}
					}
					for (var tblpos in points) {
						if (points[tblpos] === 26) {
							for (var key = 1; key <= gamedata.maxplayers; key++) {
								if (key !== tblpos) {
									points[key] = 26;
								}
							}
							points[tblpos] = 0;
							break;
						}
					}
					var tablepositions = [],
						whens = "";
					for (var tblpos in points) {
						tablepositions.push(tblpos);
						whens += " WHEN " + mysql.escape(parseInt(tblpos)) + " THEN points + " + points[tblpos];
					}
					mysql.query("UPDATE games_hearts_playerdata SET points = CASE tableposition" + whens + " END WHERE gameid = " + mysql.escape(gameId) + " AND tableposition IN (" + tablepositions.join(", ") + ")");
					mysql.query("UPDATE games_hearts_gamedata SET passedcards = 0, brokenhearts = 0, round = round + 1 WHERE gameid = " + mysql.escape(gameId));
					mysql.query("SELECT points FROM games_hearts_playerdata WHERE gameid = " + mysql.escape(gameId), function (err, players, fields) {
						mysql.query("SELECT value FROM games_settings WHERE gameid = " + mysql.escape(gameId) + " AND settingname = 'endPoints'", function (err, rows, fields) {
							var endPoints = rows[0];
							for (var key = 0; key < players.length; key++) {
								if (players[key].points >= endPoints.value) {
									var ended = true;
									break;
								}
							}
							if (ended) {
								//Game has ended
								mysql.query("UPDATE games_lobby SET ended = 1 WHERE id = " + mysql.escape(gameId));
								helpers.sendGameData(gameId);
								console.log("GAMES: HEARTS: game: " + gameId + " has ended.");
							} else {
								helpers.startNewGameRound(gameId);
							}
						});
					});
				});
			});
		}
	};
	
	var listeners = {
		opengame: function (socket, gameId, data) {
			mysql.query("SELECT count(*) AS cardamount FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, rows, fields) {
				if (rows[0].cardamount > 0) {
					helpers.sendGameData(gameId, socket);
				} else {
					helpers.getGameLobbyData(gameId, function (gameData) {
						messages.emit(socket, gameId, "gamelobby", gameData);
					});
				}
				helpers.addGameListener(gameId, socket);
				socket.on("disconnect", function () {
					helpers.removeGameListener(socket);
				});
			});
		}.bind(this),
		start: function (socket, gameId, data) {
			mysql.query("SELECT count(*) AS cardamount FROM games_hearts_cards WHERE gameid = " + mysql.escape(gameId), function (err, rows, fields) {
				if (err) {
					console.log("DATABASE ERROR SELECT CARDCOUNT AT GAMESTART ERR: " + err);
					messages.emit(socket, gameId, "error", "Can't start game, couldn't check if the game was already started: ERR: " + err);
					return;
				}
				if (rows[0].cardamount > 0) {
					messages.emit(socket, gameId, "error", "You can't start this game because it has already been started.");
					return;
				}
				helpers.getGameLobbyData(gameId, function (gameData) {
					if (socket.userdata.id !== gameData.creatorId) {
						messages.emit(socket, gameId, "error", "You can't start this game cause you didn't create it.");
						return;
					}
					if (gameData.players.length !== gameData.maxPlayers) {
						messages.emit(socket, gameId, "error", "This game can't be started yet because there need to be " + gameData.maxPlayers + " players.");
						return;
					}
					gameFunds.checkStatus(gameId, function (err, list) {
						if (err) {
							messages.emit(socket, gameId, "error", "Couldn't check the gamefunds status thus couldn't start the game. Try again later.");
							return;
						}
						if (list.length !== gameData.maxPlayers) {
							var values = [],
								amount = 0;
							for (var key in gameData.settings) {
								if (key === 'betAmount') {
									amount = gameData.settings[key];
								}
							}
							for (var key = 0; key < gameData.players.length; key++) {
								values.push({
									userid: gameData.players[key].id,
									satoshi: amount
								});
							}
							gameFunds.requestGameFunds(gameId, values, function (err) {
								if (err) {
									messages.emit(socket, gameId, "error", "Requesting gamefunds failed. Please try again later, if the error persists, contact support.");
									return;
								}
								messages.emit(socket, gameId, "success", "Gamefunds have been requested.");
								if (amount === 0) {
									listeners.start(socket, gameId, data);
								}
							});
						} else {
							for (var key = 0; key < list.length; key++) {
								if (!list[key].paid) {
									messages.emit(socket, gameId, "error", "This game can't be started yet, user " + list[key].userid + " still has to autherize hes funds.");
									return;
								}
							}
							mysql.query("INSERT INTO games_hearts_gamedata (gameid) VALUES (" + mysql.escape(gameId) + ")", function (err, rows, fields) {
								if (err) {
									console.log("ERROR INSERTING gamid in games_hearts_gamedata ERR: " + err);
								}
							});
							var query = [];
							for (var key = 0; key < gameData.players.length; key++) {
								query.push("(" + mysql.escape(gameId) + "," + mysql.escape(gameData.players[key].id) + "," + mysql.escape(key + 1) + ")");
							}
							mysql.query("INSERT INTO games_hearts_playerdata (gameid, playerid, tableposition) VALUES " + query.join(", "));
							helpers.startNewGameRound(gameId);
						}
					});
					
				});
			});
		},
		join: function (socket, gameId, data) {
			helpers.getGameLobbyData(gameId, function (gameData) {
				if (gameData.players.length >= gameData.maxPlayers) {
					messages.emit(socket, gameId, "error", "The maximum number of players has already been reached.");
					return;
				}
				for (var key = 0; key < gameData.players.length; key++) {
					if (gameData.players[key].id === socket.userdata.id) {
						messages.emit(socket, gameId, "error", "You have already joined this game.");
						return;
					}
				}
				mysql.query("INSERT INTO games_players (gameid, playerid) VALUES (" + mysql.escape(gameId) + ", " + mysql.escape(socket.userdata.id) + ")", function (err, rows, fields) {
					if (err) {
						console.log("GAMES: HEARTS: DATABASE JOIN ERROR: " + err);
						messages.emit(socket, gameId, "error", err + "");
						return;
					}
					helpers.getGameLobbyData(gameId, function (gameData) {
						helpers.callGameListeners(gameId, "gamelobby", gameData);
					}, true);
				});
			});
		}.bind(this),
		leave: function (socket, gameId, data) {
			helpers.getGameLobbyData(gameId, function (gameData) {
				if (typeof gameData.cards === "object") {
					messages.emit(socket, gameId, "error", "You can't leave this game because it has already been started.");
					return;
				}
				for (var key = 0; key < gameData.players.length; key++) {
					if (gameData.players[key].id === socket.userdata.id) {
						function updateLobby (err) {
							if (err) {
								messages.emit(socket, gameId, "error", "There was an error removing you form this game. Err: " + err + "");
								return;
							}
							helpers.getGameLobbyData(gameId, function (gameData) {
								helpers.callGameListeners(gameId, "gamelobby", gameData);
							}, true);
						}
						if (socket.userdata.id === gameData.creatorId) {
							if (gameData.players.length > 1) {
								gameData.players.splice(key, 1);
								mysql.query("UPDATE games_lobby SET creatorid = " + mysql.escape(gameData.players[0].id) + " WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
									if (err) {
										messages.emit(socket, gameId, "error", "There was an error assigning someone else as creator. Err: " + err + "");
										console.log("DATABASE ERROR ASSIGNING CREATOR: " + err);
										return;
									}
									helpers.removePlayer(gameId, socket.userdata.id, updateLobby);
								});
							} else {
								mysql.query("UPDATE games_lobby SET ended = 1 WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
									if (err) {
										messages.emit(socket, gameId, "error", "There was an error assigning someone else as creator. Err: " + err + "");
										console.log("DATABASE ERROR ENDING EMPTY GAME: " + err);
										return;
									}
									helpers.removePlayer(gameId, socket.userdata.id, updateLobby);
								});
							}
						} else {
							helpers.removePlayer(gameId, socket.userdata.id, updateLobby);
						}
						return;
					}
				}
				messages.emit(socket, gameId, "error", "You can't leave a game that you aren't in.");
			});
		}.bind(this),
		card: function (socket, gameId, cardtype) {
			mysql.query("SELECT passedcards FROM games_hearts_gamedata WHERE gameid = " + mysql.escape(gameId), function (err, gamedata, fields) {
				if (err) {
					console.log("ERROR SELLECTING GAMEDATA ON CARD ERR: " + err);
					messages.emit(socket, gameId, "error", err + "");
					return;
				}
				if (!gamedata[0].passedcards) {
					helpers.passCard(gameId, socket.userdata.id, cardtype, socket);
				} else {
					helpers.playCard(gameId, socket.userdata.id, cardtype, socket);
				}
			});
		},
		kick: function (socket, gameId, playerId) {
			mysql.query("SELECT creatorid FROM games_lobby WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
				if (rows[0].creatorid !== socket.userdata.id) {
					console.log(rows[0].creatorid, socket.userdata.id);
					messages.emit(socket, gameId, "error", "You aren't allowed to kick players since you didn't start this game.");
					return;
				}
				helpers.getGameLobbyData(gameId, function (gameData) {
					if (typeof gameData.cards === "object") {
						messages.emit(socket, gameId, "error", "You can't kick this player because it has already been started.");
						return;
					}
					gameFunds.checkStatus(gameId, function (err, list) {
						if (list.length === gameData.maxPlayers) {
							messages.emit(socket, gameId, "error", "You can't kick this player because funds have already been requested.");
							return;
						}
						for (var key = 0; key < gameData.players.length; key++) {
							if (gameData.players[key].id === playerId) {
								function updateLobby (err) {
									if (err) {
										messages.emit(socket, gameId, "error", "There was an error removing the player form this game. Err: " + err + "");
										return;
									}
									helpers.getGameLobbyData(gameId, function (gameData) {
										helpers.callGameListeners(gameId, "gamelobby", gameData);
									}, true);
								}
								if (playerId === gameData.creatorId) {
									if (gameData.players.length > 1) {
										gameData.players.splice(key, 1);
										mysql.query("UPDATE games_lobby SET creatorid = " + mysql.escape(gameData.players[0].id) + " WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
											if (err) {
												messages.emit(socket, gameId, "error", "There was an error assigning someone else as creator. Err: " + err + "");
												console.log("DATABASE ERROR ASSIGNING CREATOR: " + err);
												return;
											}
											helpers.removePlayer(gameId, playerId, updateLobby);
										});
									} else {
										mysql.query("UPDATE games_lobby SET ended = 1 WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
											if (err) {
												messages.emit(socket, gameId, "error", "There was an error assigning someone else as creator. Err: " + err + "");
												console.log("DATABASE ERROR ENDING EMPTY GAME: " + err);
												return;
											}
											helpers.removePlayer(gameId, playerId, updateLobby);
										});
									}
								} else {
									helpers.removePlayer(gameId, playerId, updateLobby);
								}
								return;
							}
						}
						messages.emit(socket, gameId, "error", "You can't kick a player that isn't in the game.");
					});
				});
			});
		}
	};
	
	helpers.createDatabase();
	messages.register("hearts", listeners);
};