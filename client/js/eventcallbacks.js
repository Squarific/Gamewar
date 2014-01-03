//gameWar callbacks

gameWar.addEventListener("homepage", function () {
	var pagediv = tabview.open("Homepage");
	var block = pagediv.appendChild(style.currentStyle.blockText());
	block.appendChild(document.createTextNode("Welcome,"));
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createTextNode("On SQUARIFIC gameWar you can play multiplayer games against real people."));
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createTextNode("While doing so you can, if you want, bet bitcoins on who wins."));
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createTextNode("You probably want to do this now:"));
	block.appendChild(document.createElement("br"));
	var button = block.appendChild(style.currentStyle.button("Start or join a game", function () {
		gameWar.callEvent("gamelobby");
	}));
	button.style.textAlign = "center";
	block.appendChild(document.createElement("br"));
	block.appendChild(document.createElement("br"));
	var button = block.appendChild(style.currentStyle.button("Login", function () {
		gameWar.callEvent("loginscreen");
	}));
	button.style.textAlign = "center";
	var button = block.appendChild(style.currentStyle.button("Register", function () {
		gameWar.callEvent("settings");
	}));
	button.style.textAlign = "center";
});

gameWar.addEventListener("wallethq", function () {
	var pagediv = tabview.open("wallethq");
	var block = pagediv.appendChild(style.currentStyle.blockText());
	block.appendChild(document.createTextNode("Your wallet status"));
});

gameWar.addEventListener("activegames", function () {
	var pagediv = tabview.open("Active games");
	var block = pagediv.appendChild(style.currentStyle.blockText());
	block.appendChild(document.createTextNode("Your active games"));
	var list = block.appendChild(document.createElement("div"));
	list.appendChild(document.createTextNode("Loading..."));
	
	function updateList () {
		network.emit("activegameslist", undefined, function (data) {
			while (list.firstChild) {
				list.removeChild(list.firstChild);
			}
			var button = list.appendChild(style.currentStyle.button("Refresh", function (event) {
				if (!event.target.classList.contains("default_disabled")) {
					updateList();
				}
				event.target.classList.add("default_disabled");
				while (event.target.firstChild) {
					event.target.removeChild(event.target.firstChild);
				}
				event.target.appendChild(document.createTextNode("Refreshing..."));
			}));
			if (data.error) {
				list.appendChild(document.createTextNode(data.error));
				return;
			}
			list.appendChild(style.currentStyle.gameList(gameWar, data));
		});
	}
	updateList();
});

gameWar.addEventListener("game", function (gameId) {
	var pagediv = tabview.open("Game #" + gameId);
	var textblock = pagediv.appendChild(style.currentStyle.blockText());
	textblock.appendChild(document.createTextNode("Loading game #" + gameId + " ..."));
	gameWar.openGame(gameId, pagediv, function (game) {
		tabview.changeTitle(pagediv, game.name + " #" + gameId);
		tabview.addEventListener("close", function (event) {
			if (event.page === pagediv) {
				game.close();
			}
		}, true);
	});
});

gameWar.addEventListener("gamelobby", function () {
	var pagediv = tabview.open("Gamelobby");
	var newblock = style.currentStyle.blockText();
	pagediv.appendChild(newblock);
	
	var message = document.createElement("div");
	newblock.appendChild(message);
	newblock.appendChild(document.createTextNode("Start a new game"));
	newblock.appendChild(document.createElement("br"));
	
	var gamelist = style.currentStyle.blockText();
	gamelist.style.maxHeight = "300px";
	gamelist.style.maxWidth = "250px";
	gamelist.style.display = "inline-block";
	gamelist.style.verticalAlign = "top";
	newblock.appendChild(gamelist);
	
	var settingList = style.currentStyle.blockText();
	settingList.style.maxWidth = "250px";
	settingList.style.maxHeight = "350px";
	settingList.style.display = "inline-block";
	settingList.style.verticalAlign = "top";
	newblock.appendChild(settingList);
	
	network.emit("gamelist", undefined, function (data) {
		for (var key in data) {
			var gamebutton = style.currentStyle.button(data[key], function (event) {
				gameWar.loadGame(event.target.game, function (game) {
					while (settingList.firstChild) {
						settingList.removeChild(settingList.firstChild);
					}
					var gamename = event.target.game;
					var game = gameWar.exampleGames[gamename];
					var settings = {};
					for (var key in game.settings) {
						var input = style.currentStyle.labeledInput(game.settings[key].type, game.settings[key].label);
						input.label.title = game.settings[key].info;
						input.input.title = game.settings[key].info;
						for (var k in game.settings[key].input) {
							input.input[k] = game.settings[key].input[k];
						}
						settingList.appendChild(input.label);
						settingList.appendChild(input.input);
						settings[key] = input.input;
					}
					var submitGameButton = style.currentStyle.button("Create new game", function (event) {
						var submitSettings = {};
						for (var key in settings) {
							submitSettings[key] = settings[key].value;
						}
						network.emit("newgame", {
							name: gamename,
							settings: submitSettings
						}, function (data) {
							while (message.firstChild) {
								message.removeChild(message.firstChild);
							}
							if (data.gameId) {
								gameWar.callEvent("game", data.gameId);
							}
							message.appendChild(document.createTextNode(data.success || data.error));
						});
					});
					submitGameButton.style.minWidth = "200px";
					submitGameButton.style.maxWidth = "200px";
					submitGameButton.style.marginLeft = "0px";
					settingList.appendChild(submitGameButton);
				});
			});
			gamebutton.game = key;
			gamebutton.style.minWidth = "200px";
			gamebutton.style.maxWidth = "200px";
			gamelist.appendChild(gamebutton);
		}
	});
	
	var listblock = style.currentStyle.blockText();
	listblock.appendChild(document.createTextNode("Or join one of the other games"));
	listblock.style.maxHeight = "80%";
	pagediv.appendChild(listblock);
	var list = document.createElement("div");
	list.appendChild(document.createElement("br"));
	list.appendChild(document.createTextNode("Loading joinable games..."));
	listblock.appendChild(list);
	
	function updateList () {
		network.emit("gamelobbylist", undefined, function (gamelist) {
			while (list.firstChild) {
				list.removeChild(list.firstChild);
			}
			var button = list.appendChild(style.currentStyle.button("Refresh", function (event) {
				if (!event.target.classList.contains("default_disabled")) {
					updateList();
				}
				event.target.classList.add("default_disabled");
				while (event.target.firstChild) {
					event.target.removeChild(event.target.firstChild);
				}
				event.target.appendChild(document.createTextNode("Refreshing..."));
			}));
			list.appendChild(style.currentStyle.gameList(gameWar, gamelist));
		});
	}
	updateList();
});

gameWar.addEventListener("loginscreen", function () {
	var pagediv = tabview.open("Login");
	pagediv.style.textAlign = "center";
	
	var blocktext = style.currentStyle.blockText();
	
	blocktext.appendChild(document.createElement("br"));
	var message = document.createElement("div");
	blocktext.appendChild(message);
	blocktext.appendChild(document.createElement("br"));

	var username = style.currentStyle.labeledInput("text", "Username");
	blocktext.appendChild(username.label);
	blocktext.appendChild(username.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password = style.currentStyle.labeledInput("password", "Password");
	blocktext.appendChild(password.label);
	blocktext.appendChild(password.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.currentStyle.button("Login", function () {
		var plainpassword = password.input.value;
		network.emit("login", {
			username: username.input.value,
			password: password.input.value
		}, function (data) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode(data.error || data.success));
			if (data.success) {
				localStorage.setItem("gamewar.password", plainpassword);
			}
		});
	});
	blocktext.appendChild(button);
	blocktext.appendChild(document.createElement("br"));
	
	var guestbutton = style.currentStyle.button("Login as guest", function () {
		network.emit("login", false, function (data) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode(data.error || data.success));
		});
	});
	blocktext.appendChild(guestbutton);
	
	pagediv.appendChild(blocktext);
});

gameWar.addEventListener("settings", function () {
	var pagediv = tabview.open("Settings");
	pagediv.style.textAlign = "center";
	
	var message = document.createElement("div");
	
	var blocktext = style.currentStyle.blockText();
	blocktext.appendChild(message);
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createTextNode("Change your settings (leave blank what you don't want to change): "));
	blocktext.appendChild(document.createElement("br"));
	pagediv.appendChild(blocktext);
	
	var username = style.currentStyle.labeledInput("text", "Username");
	blocktext.appendChild(username.label);
	blocktext.appendChild(username.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password = style.currentStyle.labeledInput("password", "Password");
	blocktext.appendChild(password.label);
	blocktext.appendChild(password.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password2 = style.currentStyle.labeledInput("password", "Password (just to be sure)");
	blocktext.appendChild(password2.label);
	blocktext.appendChild(password2.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.currentStyle.button("Change settings", function () {
		if (password.input.value !== password2.input.value) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode("Passwords don't match."));
			return;
		}
		if (password.input.value.length < 3 && password.input.value.length > 0) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode("Your password is too short."));
			return;
		}
		network.emit("changesettings", {
			username: username.input.value || undefined,
			password: password.input.value || undefined
		}, function (data) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode(data.error || data.success));
		});
	});
	blocktext.appendChild(button);
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createTextNode("Add another email."));
	blocktext.appendChild(document.createElement("br"));
	
	var email = style.currentStyle.labeledInput("email", "Email");
	blocktext.appendChild(email.label);
	blocktext.appendChild(email.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.currentStyle.button("Add email", function () {
		network.emit("changesettings", {
			email: email.input.value
		}, function (data) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode(data.error || data.success));
			while (emails.firstChild) {
				emails.removeChild(emails.firstChild);
			}
			if (data.emaillist.length === 0) {
			emails.appendChild(document.createTextNode("None."));
			}
			for (var e = 0; e < data.emaillist.length; e++) {
				emails.appendChild(document.createTextNode(data.emaillist[e]));
				emails.appendChild(document.createElement("br"));
			}
		});
	});
	blocktext.appendChild(button);
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createElement("br"));
	
	var emails = document.createElement("div");
	emails.style.display = "inline-block";
	emails.style.textAlign = "left";
	emails.style.width = "500px";
	blocktext.appendChild(document.createTextNode("Current emailaddress associated with this account:"));
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(emails);
	blocktext.appendChild(document.createElement("br"));
	network.emit("emaillist", undefined, function (emaillist) {
		if (emaillist.length === 0) {
			emails.appendChild(document.createTextNode("None."));
		}
		for (var e = 0; e < emaillist.length; e++) {
			emails.appendChild(document.createTextNode(emaillist[e]));
			emails.appendChild(document.createElement("br"));
		}
	});
});

//Network callbacks

network.on("accountswitch", function (data) {
	var username = document.getElementById("username");
	
	while(username.firstChild) {
		username.removeChild(username.firstChild);
	}
	
	username.appendChild(document.createTextNode(data.name));
	localStorage.setItem("gamewar.username", data.name);
	
	gameWar.userId = data.userId;
});

network.on("password", function (pass) {
	localStorage.setItem("gamewar.password", pass);
});

network.on("connect", function () {
	network.emit("login", {
		username: localStorage.getItem("gamewar.username"),
		password: localStorage.getItem("gamewar.password")
	}, function (response) {
		if (response.error) {
			network.emit("login");
		}
	});
});

network.on("disconnect", function () {
	var username = document.getElementById("username");
	
	while(username.firstChild) {
		username.removeChild(username.firstChild);
	}
	
	username.appendChild(document.createTextNode("Not connected!"));
});