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
			events[eventname][key].cb.apply(gameWar, eventArgs);
			if (events[eventname][key].once) {
				events[eventname].splice(key, 1);
				key--;
			}
		}
	};
};

var network = io.connect("127.0.0.1:8080");
var gameWar = new GameWar();

network.emit("login", {
	username: localStorage.getItem("gamewar.username"),
	password: localStorage.getItem("gamewar.password")
});