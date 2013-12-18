var style = {
	"default": {
		button: function (text, callback) {
			var button = document.createElement("div");
			button.appendChild(document.createTextNode(text));
			button.className = "default_button";
			button.addEventListener("click", callback);
			button.addEventListener("dbclick", function (event) {
				event.preventDefault();
			});
			return button;
		},
		label: function (text, minwidth) {
			var label = document.createElement("div");
			label.className = "default_label";
			label.style.minWidth = minwidth + "px";
			label.appendChild(document.createTextNode(text));
			return label;
		},
		input: function (type, placeholder) {
			var input = document.createElement("input");
			input.type = type;
			input.className = "default_input";
			input.placeholder = placeholder || "";
			return input;
		},
		labeledInput: function (type, labelText, placeholder) {
			var label = this.label(labelText);
			var input = this.input(type, labelText || placeholder);
			return {
				label: label, 
				input: input
			};
		},
		blockText: function () {
			var blocktext = document.createElement("div");
			blocktext.className = "default_blocktext";
			return blocktext;
		},
		gameButton: function (game, games, callback) {
			var button = document.createElement("div");
			button.className = "default_button";
			button.style.display = "block";
			button.style.minWidth = "200px";
			button.addEventListener("click", callback);
			button.appendChild(this.label("Gamename: " + games[game.name].name, 300));
			button.appendChild(this.label("Started by: " + game.creatorname, 300));
			button.appendChild(this.label("Players: " + game.currentplayercount + "/" + game.maxplayers, 300));
			button.appendChild(this.label("Bet amount: " + game.betamount, 300));
			button.appendChild(document.createElement("br"));
			for (var key in game.settings) {
				if (key === "players" || key === "betAmount") {
					continue;
				}
				button.appendChild(this.label(games[game.name].settings[key].label + ": " + game.settings[key], 300));
			}
			return button;
		}
	}
};
style.currentStyle = style.default;