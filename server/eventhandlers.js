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
		if (data.email) {
			if (data.email.length < 5 || data.email.length > 150) {
				callback({error: "That email is too short (or too long)!"});
				return;
			}
			if (!socket || !socket.userdata || !socket.userdata.id) {
				callback({error: "You can't change settings while not logged in."});
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
			var allowed = ["username", "password"];
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
}