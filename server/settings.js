module.exports = {
	server: {
		port: 8080,
		name: "SQUARIFIC gameWar Server"
	},
	admin: {
		password: "df065f1fb414561dfc85621c9bdf9f73086039ad40ecd47ff547b60f677e9375"
	},
	database: {
		hostname: "localhost",
		username: "gamewar",
		password: "gmpass45",
		database: "gamewar",
		dropGeneralTables: true,
		dropGameFundsTable: true
	},
	games: {
		"hearts": "Hearts (Black Lady)"
	},
	gameSettings: {
		cacheTime: 1500,
		dropTables: true
	},
	backup: {
		emails: ["alemaaltevinden@gmail.com"],
		emailTime: 5 * 60 * 1000,
		filename: "backups/gamewarDatabaseBackup",
		fileTime: 3 * 60 * 1000
	},
	blockchain: {
		guid: "",
		main_password: "YGLKdQXgm6XvQ2AbLkzSssoCyyEC2ck9k4IuIdpt",
		second_password: "ZAnFYYiQ7rYqUzJNKGzY9uDkQDVtIMAXPyoQGsDz"
	}
}