module.exports = function Wallet (mysql) {
	var query = "CREATE TABLE IF NOT EXISTS ";
		query += "users (";
		query += "`id` bigint NOT NULL AUTO_INCREMENT,";
		query += "`username` varchar(32) UNIQUE,";
		query += "`password` varchar(255),";
		query += "`guest` int DEFAULT 1,";
		query += "`satoshi` INT DEFAULT 0,";
		query += "PRIMARY KEY (ID),";
		query += "UNIQUE (username)";
		query += ")";
	target.query(query);
		query = "CREATE TABLE IF NOT EXISTS ";
		query += "users (";
		query += "`id` bigint NOT NULL AUTO_INCREMENT,";
		query += "`username` varchar(32) UNIQUE,";
		query += "`password` varchar(255),";
		query += "`guest` int DEFAULT 1,";
		query += "`satoshi` INT DEFAULT 0,";
		query += "PRIMARY KEY (ID),";
		query += "UNIQUE (username)";
		query += ")";
	target.query(query);

	this.transaction = function (fromWallet, toWallet, amount) {
		
	};

	this.requestTransaction = function (fromWallet, toWallet, amount) {
		var transactionId
	};

	this.getWalletIdFromPlayerId = function (playerId, callback) {
		
	};

	this.getWalletIdFromGame = function (gameName, callback) {
		
	};

	this.createWallet = function (playerId, callback) {
		mysql.query("INSERT INTO wallets (" + ((typeof playerId === "string") ? "gamename" : "playerid") + ") VALUES (" + mysql.escape(playerId) + ")", function (err, result) {
			if (err) {
				console.log("CREATE WALLET DATABASE ERROR: " + err);
				return;
			}
			callback(result.insertId);
		});
	};
};