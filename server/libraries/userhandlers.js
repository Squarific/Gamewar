module.exports = function userhandlers (mysql, CryptoJS) {
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
				console.log("Someone tried logging in with name: " + name + " and pass: " + pass + " but failed.");
			} else {
				socket.userdata = socket.userdata || {};
				socket.userdata.id = rows[0].id;
				callback({success: "You succesfully logged in as " + name});
				console.log("User logged in: " + name + " with ID: " + rows[0].id);
				socket.emit("accountswitch", {
					name: name,
					userId: socket.userdata.id
				});
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
			console.log("New guest account created, name: " + name + " with ID: " + result.insertId);
			callback({success: "Logged in as " + name});
			socket.userdata = socket.userdata || {};
			socket.userdata.id = result.insertId;
			socket.emit("password", plainpass);
			socket.emit("accountswitch", {
				name: name,
				userId: socket.userdata.id
			});
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
						socket.emit("accountswitch", {
							name: data.username,
							userId: socket.userdata.id
						});
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
	
	this.getSatoshiOfUserId = function (id, callback) {
		mysql.query("SELECT satoshi FROM users WHERE id = " + mysql.escape(id), function (err, rows, fields) {
			if (err) {
				console.log("SATOSHIOFUSERID DATABASE ERROR: ", err);
				return;
			}
			callback(rows[0].satoshi);
		});
	};
	
	this.getTransactionsOfUserId = function (id, callback) {
		mysql.query("SELECT reason, `datetime`, satoshi FROM transactions WHERE userid = " + mysql.escape(id), function (err, rows, fields) {
			if (err) {
				console.log(fields);
				console.log("GETTRANSACTIONSOFUSERID DATABASE ERROR: ", err);
				return;
			}
			callback(rows);
		});
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
};