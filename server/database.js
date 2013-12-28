module.exports = {
	createTables: function (target) {
		
		/*target.query("DROP TABLE games_settings");
		target.query("DROP TABLE games_players");
		target.query("DROP TABLE games_lobby");
		target.query("DROP TABLE users");
		target.query("DROP TABLE emails");*/
		
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
		
		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "emails (";
		query += "`id` int NOT NULL AUTO_INCREMENT,";
		query += "`uid` varchar(32),";
		query += "`email` text,";
		query += "PRIMARY KEY (id)";
		query += ")";
		target.query(query);

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
		target.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_settings (";
		query += "`gameid` bigint NOT NULL,";
		query += "`settingname` varchar(32),";
		query += "`value` bigint,";
		query += "PRIMARY KEY (gameid, settingname),";
		query += "FOREIGN KEY (gameid)";
        query += "REFERENCES games_lobby(id)";
		query += ")";
		target.query(query);

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
		target.query(query);
	}
};