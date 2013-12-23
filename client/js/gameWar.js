var GameWar = function GameWar () {
	var events = {};
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
		if (!this.games || typeof this.games[constructorName] !== "function") {
			var script = document.createElement("script");
			script.addEventListener("error", function (event) {
				console.log("ERROR Can't load game '" + game + "'" + " EVENT: " + event);
			});
			script.addEventListener("load", function () {
				if (!this.games || typeof this.games[constructorName] !== "function") {
					console.log("ERROR File loaded but constructor of game not present. GAME: '" + game + "'");
				}
				callback();
			}.bind(this));
			script.src = "js/games/" + game + ".js";
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			callback();
		}
	};
};

var network = io.connect("127.0.0.1:8080");
var gameWar = new GameWar();