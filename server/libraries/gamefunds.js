module.exports = function GameFunds (mysql) {
	var query = "CREATE TABLE IF NOT EXISTS ";
		query += "gamefunds (";
		query += "`gameid` BIGINT,";
		query += "`userid` BIGINT,"
		query += "`paid` TINYINT DEFAULT 0,";
		query += "`satoshi` BIGINT DEFAULT 0,";
		query += "PRIMARY KEY (gameid, userid)";
		query += ")";
	mysql.query(query);
	
	this.getFundsOfUserId = function (userid, callback) {
		mysql.query("SELECT gameid, paid, satoshi FROM gamefunds WHERE userid = " + mysql.escape(userid), function (err, rows, fields) {
			if (err) {
				console.log("GETFUNDSOFUSERID DATABASE ERROR: ", err);
				callback({error: "DATABASE ERROR: Can't request funds."});
				return;
			}
			callback(rows);
		});
	};

	this.authorizeFunds = function (gameid, userid, callback) {
		mysql.query("SELECT satoshi, (SELECT satoshi FROM gamefunds WHERE gameid = " + mysql.escape(gameid) + ") AS satoshitopay FROM users WHERE id = " + mysql.escape(userid), function (err, rows, fields) {
			if (error || !rows || rows.length < 1) {
				console.log("AUTHORIZE FUNDS DATABASE ERROR:", err, rows);
				callback({error: "DATABASE ERROR: Can't authorize funds."});
				return;
			}
			if (rows[0].satoshi >= rows[0].satoshitopay) {
				mysql.query("INSERT INTO transactions (userid, reason, satoshi) VALUES (" + mysql.escape(userid) + ", 'Authorized funds for game #" + mysql.escape(gameid) + "', " + mysql.escape(-rows[0].satoshitopay) + ")");
				mysql.query("UPDATE users SET satoshi = satoshi - " + mysql.escape(rows[0].satoshitopay) + " WHERE userid = " + mysql.escape(userid));
				mysql.query("UPDATE gamefunds SET paid = 1 WHERE gameid = " + mysql.escape(gameid) + " AND userid = " + mysql.escape(userid), function (err) {
					if (err) {
						console.log("AUTHORIZE FUNDS DATABASE ERROR (UPDATE):", err, rows);
						callback({error: "DATABASE ERROR: Can't authorize funds."});
						return;
					}
					callback({success: "Funds for game #" + gameid + " are autorized."});
				});
			} else {
				callback({error: "Can't authorize funds: you don't have enough bitcoins."});
			}
		});
	};

	this.requestGameFunds = function (gameid, values) {
		if (values.length < 1) {
			console.log("REQUESTGAMEFUNDS ERROR: wrong value count ", values, values.length);
			return;
		}
		var mysqlvalues = [];
		for (var key = 0; key < values.length; key++) {
			mysqlvalues.push("(" + mysql.escape(gameid) + ", " + mysql.escape(values[key].userid) + ", " + ((parseInt(values[key].satoshi) === 0) ? 1 : 0) + ", " + mysql.escape(parseInt(values[key].satoshi)) + ")");
		}
		mysql.query("INSERT INTO gamefunds (gameid, userid, paid, satoshi) VALUES " + mysqlvalues.join(", "), function (err) {
			if (err) {
				console.log("REQUESTGAMEFUNDS DATABASE ERROR: ", err);
			}
		});
	};

	this.checkStatus = function (gameid, callback) {
		mysql.query("SELECT userid, paid, satoshi FROM gamefunds WHERE gameid = " + mysql.escape(gameid), function (err, rows, fields) {
			callback(rows);
		});
	};
};