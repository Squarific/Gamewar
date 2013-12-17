module.exports = function eventhandlers (mysql, CryptoJS) {
	this.login = function (socket, name, pass, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		mysql.query("SELECT id FROM users WHERE username = " + mysql.escape(name) + " AND password = " + mysql.escape(pass.toString(CryptoJS.enc.Hex)), function (err, rows, fields) {
			if (err) {
				console.log(err);
				callback({error: err.toString()});
				return;
			}
			if (rows.length < 1) {
				callback({error: "No user with this name and password is registered."});
				console.log("Someone tried logging in with name: " + name + " and pass: " + pass);
			} else {
				socket.userdata = socket.userdata || {};
				socket.userdata.id = rows[0].id;
				callback({success: "You succesfully logged in as " + name});
				console.log("User logged in: " + name + " with ID: " + rows[0].id);
				socket.emit("accountswitch", name);
			}
		});
	};
	
	this.newguest = function (socket, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		var name = "GUEST_" + (Math.random() + 1).toString(36).substr(2, 6),
			plainpass = (Math.random() + 1).toString(36).substr(2, 7),
			pass = CryptoJS.SHA256(plainpass);
		mysql.query("INSERT INTO users (username, password) VALUES (" + mysql.escape(name) + ", " + mysql.escape(pass.toString(CryptoJS.enc.Hex)) + ")", function (err, result) {
			if (err) {
				console.log(err);
				return;
			}
			console.log("New guest account: " + name + " with ID: " + result.insertId);
			callback({success: "Logged in as " + name});
			socket.userdata = socket.userdata || {};
			socket.userdata.id = result.insertId;
			socket.emit("password", plainpass);
			socket.emit("accountswitch", name);
		});
	};
	
	this.changeUserSettings = function (socket, data, callback) {
		if (typeof callback !== "function") {
			callback = function () {};
		}
		if (!socket || !socket.userdata || !socket.userdata.id) {
			callback({error: "You can't change settings while not logged in."});
			return;
		}
		if (data.email) {
			if (data.email.length < 5 || data.email.length > 150) {
				callback({error: "That email is too short (or too long)!"});
				return;
			}
			mysql.query("INSERT INTO emails (uid, email) VALUES (" + mysql.escape(socket.userdata.id) + ", " + mysql.escape(data.email) + ")", function (err) {
				if (err) {
					callback({error: err.toString()});
					console.log(err);
					return;
				}
				console.log("Email " + data.email + " added to account " + socket.userdata.id);
				this.emails(socket.userdata.id, function (list) {
					callback({
						success: "Email " + data.email + " added.",
						emaillist: list
					});
				});
			}.bind(this));
		} else {
			var change = [];
			if (data.username) {
				if (data.username.length < 3) {
					callback({error: "Username has to be longer than 3 characters."});
					return;
				}
				change.push("username = " + mysql.escape(data.username));
			}
			if (data.password) {
				change.push("password = " + mysql.escape(CryptoJS.SHA256(data.password).toString(CryptoJS.enc.Hex)));
			}
			if (change.length < 1) {
				callback({error: "Can't change settings: nothing provided."});
				return;
			}
			var query = "UPDATE users SET ";
			query += change.join(", ");
			query += ", guest = 0";
			query += " WHERE id = " + mysql.escape(socket.userdata.id);
			mysql.query(query, function (err, rows, fields) {
				if (err) {
					if (err.toString().indexOf("DUP_ENTRY") > -1) {
						callback({error: "Username " + data.username + " is already being used."});
						return;
					}
					console.log(err);
					callback({error: err.toString()});
					return;
				} else {
					var success = "Successfuly updated settings.";
					if (data.username) {
						socket.emit("accountswitch", data.username);
						console.log("Updated username of account ID: " + socket.userdata.id + " to " + data.username);
						success += " Username set to " + data.username + ".";
					}
					if (data.password) {
						socket.emit("password", data.password);
						success += " Password changed to " + new Array(data.password.length).join("*");
						console.log("Updated password of account ID: " + socket.userdata.id);
					}
					callback({success: success});
				}
			});
		}
	};
	
	this.emails = function (id, callback) {
		if (typeof callback !== "function") {
			console.log("Can't get emails: no callback provided.");
			return;
		}
		mysql.query("SELECT email FROM emails WHERE uid = " + mysql.escape(id), function (err, rows, fields) {
			if (err) {
				callback({error: err.toString()});
				console.log(err);
				return;
			}
			var list = [];
			for (var r = 0; r < rows.length; r++) {
				list.push(rows[r].email);
			}
			callback(list);
		});
	};
	
	this.newGame = function (socket, data, settings, games, callback) {
		if (!socket.userdata || typeof socket.userdata.id !== "number") {
			callback({error: "You can't make a new game when you aren't logged in"});
			return;
		}
		if (typeof settings.games[data.name] !== "string" || !games[data.name]) {
			callback({error: "This game doesn't exist."});
			console.log("Someone tried starting a game with name", data.name, "DATA: ", data, "SETTINGS: ", settings, "LOADED GAMES:", games);
			return;
		}
		var datasettings = {};
		for (var key in games[data.name].settings) {
			data.settings[key] = parseInt(data.settings[key]);
			if (!(data.settings[key] >= games[data.name].settings[key].input.min && data.settings[key] <= games[data.name].settings[key].input.max)) {
				callback({error: key + " was not within the allowed boundry of min " + games[data.name].settings[key].input.min + " and max " + games[data.name].settings[key].input.max + ", value was " + data.settings[key]});
				return;
			}
			datasettings[key] = data.settings[key];
		}
		mysql.query("INSERT INTO games_lobby (name) VALUES (" + mysql.escape(data.name) + ")", function (err, result) {
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
					callback({success: "Game '" + gameId + "' created"});
					console.log("Game " + data.name + " with ID: " + gameId + " created by USER ID: " + socket.userdata.id);
				});
			});
		});
	};
	
	this.getOpenGames = function () {
		
	};
}