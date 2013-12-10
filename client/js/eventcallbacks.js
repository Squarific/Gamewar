gameWar.addEventListener("loginscreen", function () {
	var pagediv = tabview.open("Login to another account");
	pagediv.style.textAlign = "center";
	
	var blocktext = document.createElement("div");
	blocktext.className = "default_blocktext";
	
	blocktext.appendChild(document.createElement("br"));

	var label = document.createElement("div");
	label.className = "default_label";
	label.appendChild(document.createTextNode("Username"));
	blocktext.appendChild(label);
	var input = document.createElement("input");
	input.type = "text";
	input.className = "default_input";
	input.placeholder = "Username";
	blocktext.appendChild(input);
	
	blocktext.appendChild(document.createElement("br"));
	
	var label = document.createElement("div");
	label.className = "default_label";
	label.appendChild(document.createTextNode("Password"));
	blocktext.appendChild(label);
	var input = document.createElement("input");
	input.type = "password";
	input.className = "default_input";
	input.placeholder = "Password";
	blocktext.appendChild(input);
	
	blocktext.appendChild(document.createElement("br"));
	
	var button = document.createElement("div");
	button.appendChild(document.createTextNode("Login"));
	button.className = "default_button";
	button.style.width = "400px";
	blocktext.appendChild(button);
	
	pagediv.appendChild(blocktext);
});