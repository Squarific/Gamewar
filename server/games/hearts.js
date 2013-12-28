module.exports = function Hearts (mysql, messages) {
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
	
	var gameListeners = {};
	var helpers = {
		getGameData: function (gameId, callback, forceUpdate) {
			if (this.games[gameId] && !this.games[gameId].outdated && !forceUpdate) {
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
							this.games[gameId] = games_lobby[0];
							var settings = {};
							for (var key = 0; key < games_settings.length; key++) {
								settings[games_settings[key].settingname] = games_settings[key].value;
							}
							this.games[gameId].settings = settings;
							this.games[gameId].players = games_players;
							callback(this.games[gameId]);
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
		}
	};
	
	var listeners = {
		opengame: function (socket, gameId, data) {
			helpers.getGameData(gameId, function (gameData) {
				messages.emit(socket, gameId, "gamelobby", gameData);
				helpers.addGameListener(gameId, socket);
				socket.on("disconnect", function () {
					helpers.removeGameListener(socket);
				});
			});
		}.bind(this),
		start: function (socket, gameId, data) {
			
		},
		join: function (socket, gameId, data) {
			helpers.getGameData(gameId, function (gameData) {
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
					helpers.getGameData(gameId, function (gameData) {
						helpers.callGameListeners(gameId, "gamelobby", gameData);
					}, true);
				});
			});
		}.bind(this),
		leave: function (socket, gameId, data) {
			helpers.getGameData(gameId, function (gameData) {
				for (var key = 0; key < gameData.players.length; key++) {
					if (gameData.players[key].id === socket.userdata.id) {
						function updateLobby (err) {
							if (err) {
								messages.emit(socket, gameId, "error", "There was an error removing you form this game. Err: " + err + "");
								return;
							}
							helpers.getGameData(gameId, function (gameData) {
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
		}.bind(this)
	};
	messages.register("hearts", listeners);
};