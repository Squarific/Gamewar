module.exports = {
	createDatabaseAndTables: function (mysql, settings, callback) {
		mysql.query("CREATE DATABASE IF NOT EXISTS " + settings.database);
		mysql.query("USE " + settings.database);

		if (settings.dropGeneralTables) {
			mysql.query("DROP TABLE IF EXISTS games_settings");
			mysql.query("DROP TABLE IF EXISTS games_players");
			mysql.query("DROP TABLE IF EXISTS games_lobby");
			mysql.query("DROP TABLE IF EXISTS users");
			mysql.query("DROP TABLE IF EXISTS transactions");
			mysql.query("DROP TABLE IF EXISTS emails");
		}

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "users (";
		query += "`id` bigint NOT NULL AUTO_INCREMENT,";
		query += "`username` varchar(32) UNIQUE,";
		query += "`password` varchar(255),";
		query += "`guest` int DEFAULT 1,";
		query += "`satoshi` bigint DEFAULT 100,";
		query += "PRIMARY KEY (ID),";
		query += "UNIQUE (username)";
		query += ")";
		mysql.query(query);
		
		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "emails (";
		query += "`id` int NOT NULL AUTO_INCREMENT,";
		query += "`uid` varchar(32),";
		query += "`email` text,";
		query += "PRIMARY KEY (id)";
		query += ")";
		mysql.query(query);
		
		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "transactions (";
		query += "`id` BIGINT NOT NULL AUTO_INCREMENT,";
		query += "`userid` BIGINT,"
		query += "`reason` TEXT,";
		query += "`datetime` DATETIME DEFAULT NOW(),";
		query += "`satoshi` BIGINT,";
		query += "PRIMARY KEY (id)";
		query += ")";
		mysql.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_lobby (";
		query += "`id` bigint NOT NULL AUTO_INCREMENT,";
		query += "`name` varchar(32),";
		query += "`creatorid` bigint,";
		query += "`maxplayers` int,"
		query += "`ended` int DEFAULT 0,"
		query += "`betamount` bigint,";
		query += "PRIMARY KEY (id)";
		query += ")";
		mysql.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_settings (";
		query += "`gameid` bigint NOT NULL,";
		query += "`settingname` varchar(32),";
		query += "`value` bigint,";
		query += "PRIMARY KEY (gameid, settingname),";
		query += "FOREIGN KEY (gameid)";
        query += "REFERENCES games_lobby(id)";
		query += ")";
		mysql.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_players (";
		query += "`gameid` bigint NOT NULL,";
		query += "`playerid` bigint,";
		query += "PRIMARY KEY (gameid, playerid),";
        query += "FOREIGN KEY (gameid)";
        query += "REFERENCES games_lobby(id),";
        query += "FOREIGN KEY (playerid)";
        query += "REFERENCES users(id)";
		query += ")";
		mysql.query(query, function (err) {
			if (err) {
				console.log("DATABASE ERROR", err);
			}
			if (!err) {
				console.log("Connected to databse, created database and created tables.");
				callback();
			}
		});
	}
};