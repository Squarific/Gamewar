//gameWar callbacks

gameWar.addEventListener("gamelobby", function () {
	var pagediv = tabview.open("gamelobby");
	var newblock = style.default.blockText();
	newblock.appendChild(document.createTextNode("Start a new game"));
	network.emit("gamelist", undefined, function (data) {
		console.log(data);
	});
	
	pagediv.appendChild(newblock);
	var listblock = style.default.blockText();
	listblock.appendChild(document.createTextNode("Or join one of the other games"));
	pagediv.appendChild(listblock);
});

gameWar.addEventListener("loginscreen", function () {
	var pagediv = tabview.open("Login");
	pagediv.style.textAlign = "center";
	
	var blocktext = style.default.blockText();
	
	blocktext.appendChild(document.createElement("br"));
	var message = document.createElement("div");
	blocktext.appendChild(message);
	blocktext.appendChild(document.createElement("br"));

	var username = style.default.input("text", "Username");
	blocktext.appendChild(username.label);
	blocktext.appendChild(username.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password = style.default.input("password", "Password");
	blocktext.appendChild(password.label);
	blocktext.appendChild(password.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.default.button("Login", function () {
		network.emit("login", {
			username: username.input.value,
			password: password.input.value
		}, function (data) {
			while (message.firstChild) {
				message.removeChild(message.firstChild);
			}
			message.appendChild(document.createTextNode(data.error || data.success));
		});
	});
	blocktext.appendChild(button);
	blocktext.appendChild(document.createElement("br"));
	
	var guestbutton = style.default.button("Login as guest", function () {
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
	
	var blocktext = document.createElement("div");
	blocktext.className = "default_blocktext";
	blocktext.appendChild(message);
	blocktext.appendChild(document.createElement("br"));
	blocktext.appendChild(document.createTextNode("Change your settings (leave blank what you don't want to change): "));
	blocktext.appendChild(document.createElement("br"));
	pagediv.appendChild(blocktext);
	
	var username = style.default.input("text", "Username");
	blocktext.appendChild(username.label);
	blocktext.appendChild(username.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password = style.default.input("password", "Password");
	blocktext.appendChild(password.label);
	blocktext.appendChild(password.input);
	blocktext.appendChild(document.createElement("br"));
	
	var password2 = style.default.input("password", "Password (just to be sure)");
	blocktext.appendChild(password2.label);
	blocktext.appendChild(password2.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.default.button("Change settings", function () {
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
	
	var email = style.default.input("email", "Email");
	blocktext.appendChild(email.label);
	blocktext.appendChild(email.input);
	blocktext.appendChild(document.createElement("br"));
	
	var button = style.default.button("Add email", function () {
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

network.on("accountswitch", function (name) {
	var username = document.getElementById("username");
	
	while(username.firstChild) {
		username.removeChild(username.firstChild);
	}
	
	username.appendChild(document.createTextNode(name));
	localStorage.setItem("gamewar.username", name);
});

network.on("password", function (pass) {
	localStorage.setItem("gamewar.password", pass);
});