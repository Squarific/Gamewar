module.exports = function gamehandlers (mysql, settings) {
	this.newGame = function (socket, data, games, callback) {
		if (!socket.userdata || typeof socket.userdata.id !== "number") {
			callback({error: "You can't make a new game when you aren't logged in"});
			return;
		}
		if (typeof settings.games[data.name] !== "string" || !games[data.name]) {
			callback({error: "This game doesn't exist or was not loaded."});
			console.log("Player " + socket.userdata.id + " tried starting a game but " + data.name + " doesn't exist or was not loaded.");
			return;
		}
		if (!games[data.name].settings.players) {
			callback({error: "There was an error with game " + data.name + ", it did not specify bounds for players or betamount."});
			console.log("Player " + socket.userdata.id + " tried starting a game but didn't specify the amount of players or the betamount.");
			return;
		}
		var datasettings = {};
		for (var key in games[data.name].settings) {
			data.settings[key] = parseInt(data.settings[key]) || 0;
			if (!(data.settings[key] >= games[data.name].settings[key].input.min && data.settings[key] <= games[data.name].settings[key].input.max)) {
				callback({error: key + " was not within the allowed boundry of min " + games[data.name].settings[key].input.min + " and max " + games[data.name].settings[key].input.max + ", value was " + data.settings[key]});
				console.log("Player " + socket.userdata.id + " tried starting a game of " + data.name + " but the setting " + key + " wasn't within the allowed limits.");
				return;
			}
			datasettings[key] = data.settings[key];
		}
		mysql.query("INSERT INTO games_lobby (name, creatorid, maxplayers, betamount) VALUES (" + mysql.escape(data.name) + ", " + mysql.escape(socket.userdata.id) + ", " + mysql.escape(datasettings.players) + ", " + mysql.escape(datasettings.betAmount) + ")", function (err, result) {
			if (err) {
				console.log("INSERT GAMES LOBBY ERR: ", err);
				callback({error: err.toString()});
				return;
			}
			var gameId = result.insertId;
			var settingsQuerys = [];
			for (var key in datasettings) {
				settingsQuerys.push("(" + mysql.escape(gameId) + ", " + mysql.escape(key) + ", " + mysql.escape(datasettings[key]) + ")");
			}
			var query = "INSERT INTO games_settings (gameid, settingname, value) VALUES " + settingsQuerys.join(", ");
			mysql.query(query, function (err, result) {
				if (err) {
					console.log("INSERT SETTINGS MYSQL ERR: ", err);
					callback({error: err.toString()});
					return;
				}
				var query = "INSERT INTO games_players (gameid, playerid) VALUES (" + mysql.escape(gameId) + ", " + mysql.escape(socket.userdata.id) + ")";
				mysql.query(query, function (err, result) {
					if (err) {
						console.log("INSERT GAMECREATOR ERR: ", err);
						callback({error: err.toString()});
						return;
					}
					callback({success: "Game '" + gameId + "' created", gameId: gameId});
					console.log("Game " + data.name + " with ID: " + gameId + " created by USER ID: " + socket.userdata.id);
				});
			});
		});
	};
	
	this.getGamesSettings = function (gamelist, callback) {
		if (gamelist.length === 0) {
			callback(gamelist);
			return;
		}
		var idlist = [];
		for (var key = 0; key < gamelist.length; key++) {
			idlist.push(gamelist[key].id);
			gamelist[key].settings = {};
		}
		mysql.query("SELECT gameid, settingname, value FROM games_settings WHERE gameid IN(" + idlist.join(", ") + ")", function (err, rows, fields) {
			if (err) {
				console.log("GETGAMESETTINGS DATABASE ERR: ", err);
				callback({error: err.toString()});
				return;
			}
			for (var rowkey = 0; rowkey < rows.length; rowkey++) {
				for (var gamekey = 0; gamekey < gamelist.length; gamekey++) {
					if (gamelist[gamekey].id === rows[rowkey].gameid) {
						gamelist[gamekey].settings[rows[rowkey].settingname] = rows[rowkey].value;
						break;
					}
				}
			}
			callback(gamelist);
		});
	};
	
	this.getOpenGames = function (callback) {
		var query = "SELECT games_lobby.id, games_lobby.name, games_lobby.creatorid, users.username AS creatorname, games_lobby.maxplayers, games_lobby.betamount, COUNT(games_players.gameid) AS currentplayercount FROM games_lobby INNER JOIN games_players ON games_lobby.id = games_players.gameid INNER JOIN users ON games_lobby.creatorid = users.id WHERE games_lobby.ended = 0 GROUP BY games_players.gameid HAVING COUNT(games_players.gameid) < games_lobby.maxplayers";
		mysql.query(query, function (err, rows, fields) {
			if (err) {
				console.log("GETOPENGAMES DATABASE ERR: ", err);
				callback({error: err.toString()});
				return;
			}
			this.getGamesSettings(rows, callback);
		}.bind(this));
	};
	
	this.getActiveGames = function (userId, callback) {
		var query = "SELECT games_lobby.id, games_lobby.name, games_lobby.creatorid, users.username AS creatorname, games_lobby.maxplayers, games_lobby.betamount FROM games_lobby INNER JOIN games_players ON games_lobby.id = games_players.gameid INNER JOIN users ON games_lobby.creatorid = users.id WHERE games_players.playerid = " + mysql.escape(userId) + " AND games_lobby.ended = 0 GROUP BY games_players.gameid";
		mysql.query(query, function (err, rows, fields) {
			if (err) {
				console.log("GETACTIVEGAMES DATABASE ERR: ", err);
				callback({error: err.toString()});
				return;
			}
			this.getGamesSettings(rows, callback);
		}.bind(this));
	};
	
	this.getGameName = function (gameId, callback) {
		mysql.query("SELECT name FROM games_lobby WHERE id = " + mysql.escape(gameId), function (err, rows, fields) {
			if (err) {
				console.log("GETGAMENAME DATABASE ERR: ", err);
				callback({error: err.toString()});
				return;
			}
			if (rows.length > 0) {
				callback(rows[0].name);
			} else {
				callback({error: "No game with this id was found."});
			}
		});
	};
}