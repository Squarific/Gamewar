var style = {
	"default": {
		button: function (text, callback) {
			var button = document.createElement("div");
			button.appendChild(document.createTextNode(text));
			button.className = "default_button";
			button.addEventListener("click", callback);
			return button;
		},
		input: function (type, name, placeholder) {
			if (!placeholder) {
				placeholder = name;
			}
			
			var label = document.createElement("div");
			label.className = "default_label";
			label.appendChild(document.createTextNode(name));
			
			var input = document.createElement("input");
			input.type = type;
			input.className = "default_input";
			input.placeholder = placeholder;
			
			return {
				label: label, 
				input: input
			};
		},
		blockText: function () {
			var blocktext = document.createElement("div");
			blocktext.className = "default_blocktext";
			return blocktext;
		}
	}
};