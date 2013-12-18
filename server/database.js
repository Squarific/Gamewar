module.exports = {
	createTables: function (target) {
		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "users (";
		query += "`id` int NOT NULL AUTO_INCREMENT,";
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
		query += "`betamount` bigint,"
		query += "PRIMARY KEY (id)";
		query += ")";
		target.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_settings (";
		query += "`gameid` bigint NOT NULL,";
		query += "`settingname` varchar(32),";
		query += "`value` bigint";
		query += ")";
		target.query(query);

		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "games_players (";
		query += "`gameid` bigint NOT NULL,";
		query += "`playerid` bigint";
		query += ")";
		target.query(query);
	}
};