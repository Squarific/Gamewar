module.exports = function LoginHandlers (mysql, CryptoJS) {
	this.login = function (socket, name, pass, callback) {
		mysql.query("SELECT id FROM users WHERE name = '" + mysql.escape(name) + "' AND pass = '" + mysql.escape(pass).toString(CryptoJS.enc.Hex) + "'", function (err, rows, fields) {
			if (err) {
				console.log(err);
				callback(err);
				return;
			}
			
			if (rows.length < 1) {
				callback("No user with this name and password is registered.");
			} else {
				socket.userdata = socket.userdata || {};
				socket.userdata.name = name;
				callback("You succesfully logged in as " + name);
				socket.emit("accountswitch", name);
			}
		});
	};
	
	this.newguest = function (socket) {
		var name = "GUEST_" + (Math.random() + 1).toString(36).substr(2, 6),
			pass = CryptoJS.SHA256((Math.random() + 1).toString(36).substr(2, 7));
		mysql.query("INSERT INTO users (name, password) VALUES ('" + mysql.escape(name) + "', '" + mysql.escape(pass.toString(CryptoJS.enc.Hex)) + "')", function (err, rows, field) {
			if (err) {
				console.log(err);
				return;
			}
			
			console.log("New guest account: " + name);
			socket.userdata = socket.userdata || {};
			socket.userdata.name = name;
			socket.emit("accountswitch", name);
		});
	};
}