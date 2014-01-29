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

	this.requestGameFunds = function (gameid, values) {
		if (values.length < 1) {
			console.log("REQUESTGAMEFUNDS ERROR: wrong value count ", values, values.length);
			return;
		}
		var mysqlvalues = [];
		for (var key = 0; key < values.length; key++) {
			mysqlvalues.push("(" + mysql.escape(gameid) + ", " + mysql.escape(values[key].userid) + ", " + mysql.escape(values[key].satoshi) + ")");
		}
		mysql.query("INSERT INTO gamefunds (gameid, userid, satoshi) VALUES " + mysqlvalues.join(", "), function (err) {
			if (err) {
				console.log("REQUESTGAMEFUNDS DATABASE ERROR: ", err);
			}
		});
	};

	this.checkStatus = function (gameid, callback) {
		mysql.query("SELECT userid, (SELECT COUNT(userid) FROM gamefunds WHERE gameid = " + mysql.escape(gameid) + ") AS usercount FROM gamefunds WHERE gameid = " + mysql.escape(gameid) + " AND paid = 0");
	};
};