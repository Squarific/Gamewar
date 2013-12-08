module.exports = {
	createTables: function (target) {
		var query = "CREATE TABLE IF NOT EXISTS ";
		query += "users (";
		query += "`id` int NOT NULL AUTO_INCREMENT,";
		query += "`name` varchar(32),";
		query += "`password` varchar(64),";
		query += "`guest` int DEFAULT 1,";
		query += "`email` text,";
		query += "`satoshi` INT,";
		query += "PRIMARY KEY (ID)";
		query += ")";
		target.query(query);
	}
};