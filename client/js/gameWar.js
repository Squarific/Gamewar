var gameWarGames = gameWarGames || {};
var GameWar = function GameWar () {
	var events = {},
		waitingForGameCallbacks = {},
		networkListeners = {};
	this.exampleGames = {};

	this.addEventListeners = function (eventListeners) {
		for (var eventName in eventListeners) {
			this.addEventListener(eventName, eventListeners[eventName].cb, eventListeners[eventName].once);
		}
	};

	this.addEventListener = function (eventname, eventcallback, once) {
		events[eventname] = events[eventname] || [];
		for (var key = 0; key < events[eventname].length; key++) {
			if (events[eventname][key] === eventcallback) {
				return true;
			}
		}
		events[eventname].push({
			cb: eventcallback,
			once: once
		});
	};

	this.callEvent = function (eventname) {
		var eventArgs = Array.prototype.slice.call(arguments, 1);
		events[eventname] = events[eventname] || [];
		for (var key = 0; key < events[eventname].length; key++) {
			events[eventname][key].cb.apply(this, eventArgs);
			if (events[eventname][key].once) {
				events[eventname].splice(key, 1);
				key--;
			}
		}
	};
	this.loadGame = function (game, callback) {
		var constructorName = game.charAt(0).toUpperCase() + game.slice(1);
		if (!gameWarGames || typeof gameWarGames[constructorName] !== "function") {
			if (waitingForGameCallbacks[game]) {
				waitingForGameCallbacks[game].push(callback);
				return;
			}
			waitingForGameCallbacks[game] = [callback];
			var script = document.createElement("script");
			script.addEventListener("error", function (event) {
				console.log("ERROR Can't load game '" + game + "'" + " EVENT: " + event);
			});
			script.addEventListener("load", function () {
				if (!gameWarGames || typeof gameWarGames[constructorName] !== "function") {
					console.log("ERROR File loaded but constructor of game not present. GAME: '" + game + "'");
				}
				this.exampleGames[game] = new gameWarGames[constructorName]();
				for (var key = 0; key < waitingForGameCallbacks[game].length; key++) {
					waitingForGameCallbacks[game][key](gameWarGames[constructorName]);
				}
			}.bind(this));
			script.src = "js/games/" + game + ".js";
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			callback(gameWarGames[constructorName]);
		}
	};
	
	this.openGame = function (gameId, targetdiv, cb) {
		if (typeof cb !== "function") {
			cb = function () {};
		}
		network.emit("gamename", gameId, function (gameName) {
			if (!gameName || gameName.error) {
				while (targetdiv.firstChild) {
					targetdiv.removeChild(targetdiv.firstchild);
				}
				targetdiv.appendChild("There was a problem getting the name of the game. GAMENAME: " + gameName + " ERROR: " + gameName.error);
				return;
			}
			this.loadGame(gameName, function (Game) {
				cb(new Game(gameId, targetdiv, gameWar));
			}.bind(this));
		}.bind(this));
	};
	
	this.addNetworkListeners = function (gameId, listeners) {
		networkListeners[gameId] = networkListeners[gameId] || [];
		if (networkListeners[gameId].indexOf(listeners) === -1) {
			networkListeners[gameId].push(listeners);
		}
	};
	
	this.removeNetworkListeners = function (gameId, listeners) {
		networkListeners[gameId] = networkListeners[gameId] || [];
		var index = networkListeners[gameId].indexOf(listeners);
		if (index !== -1) {
			networkListeners[gameId].splice(index, 1);
		}
	};
	
	this.sendMessage = function (gameId, name, data) {
		network.emit("gameMessage", {
			gameId: gameId,
			name: name,
			data: data
		});
	};
	
	this.receiveMessage = function (data) {
		for (var key = 0; key < networkListeners[data.gameId].length; key++) {
			if (typeof networkListeners[data.gameId][key][data.name] === "function") {
				networkListeners[data.gameId][key][data.name](data.data);
			}
		}
	};
	
	network.on("gameMessage", this.receiveMessage);
};

var network = io.connect("127.0.0.1:8080");
var gameWar = new GameWar();