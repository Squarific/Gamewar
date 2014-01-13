var Tabview = function Tabview (tabcontainer, pagecontainer) {
	while (tabcontainer.firstChild) {
		tabcontainer.removeChild(tabcontainer.firstChild);
	}
	while (pagecontainer.firstChild) {
		pagecontainer.removeChild(pagecontainer.firstChild);
	}
	
	var events = {};

	this.open = function (title) {
		var page = document.createElement("div"),
			tab = document.createElement("div"),
			close = document.createElement("div");

		page.className = "page";
		tab.className = "link";
		close.className = "close";
		
		tab.appendChild(document.createTextNode(title));
		tab.appendChild(close);
		close.appendChild(document.createTextNode("X"));
		
		tab.page = page;
		page.tab = tab;
		
		close.addEventListener("click", function (event) {
			this.close(event.target.parentNode);
		}.bind(this), false);
		
		tab.addEventListener("click", function (event) {
			this.activate(event.target);
		}.bind(this), false);
		
		tabcontainer.appendChild(tab);
		pagecontainer.appendChild(page);

		this.resize();
		this.activate(tab);
		
		return page;
	};
	
	this.close = function (target) {
		target = target.tab || target;
		if (!target || !target.page || !target.parentNode) {
			return;
		}
		this.callEvent("close", {
			tab: target,
			page: target.page
		});
		if (target.classList.contains("active")) {
			var wasActive = true;
			var activate = target.previousSibling;
		}
		target.page.parentNode.removeChild(target.page);
		target.parentNode.removeChild(target);
		if (wasActive) {
			this.activate(activate);
		}
	};
	
	this.requestAttention = function (target) {
		target = target.tab || target;
		if (!target || !target.page || !target.parentNode) {
			return;
		}
		if (!target.classList.contains("active")) {
			target.classList.add("flashing");
		}
	};
	
	this.changeTitle = function (target, title) {
		if (target.tab) {
			target = target.tab;
		}
		while (target.firstChild) {
			target.removeChild(target.firstChild);
		}
		target.appendChild(document.createTextNode(title));
		var close = target.appendChild(document.createElement("div"));
		close.className = "close";
		close.appendChild(document.createTextNode("X"));
		close.addEventListener("click", function (event) {
			this.close(event.target.parentNode);
		}.bind(this), false);
	};

	this.resize = function () {
		var pages = document.getElementsByClassName("page");
		for (var page = 0; page < pages.length; page++) {
			if (pages[page].offsetParent) {
				pages[page].style.minHeight = window.innerHeight - pages[page].offsetParent.offsetTop + "px";
			}
		}
	};

	this.activate = function (tab) {
		tab = tab || tabcontainer.firstChild;
		if (!tab || !tab.page || !tab.parentNode) {
			return;
		}
		for (var child = 0; child < tab.parentNode.children.length; child++) {
			if (tab.parentNode.children[child] !== tab) {
				tab.parentNode.children[child].page.style.zIndex = "";
				tab.parentNode.children[child].page.style.display = "none";
				tab.parentNode.children[child].classList.remove("active");
			}
		}
		tab.page.style.zIndex = 999;
		tab.page.style.display = "";
		tab.classList.add("active");
		tab.classList.remove("flashing");
		this.resize();
	};
	
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

	this.removeEventListener = function (eventName, cb) {
		events[eventName] = events[eventName] || [];
		var index = events[eventName].indexOf(cb)
		if (index !== -1) {
			events[eventName].splice(index, 1);
		}
	};
	
	window.addEventListener("resize", this.resize);
};

var tabview = new Tabview(document.getElementById("tabcontainer"), document.getElementById("pagecontainer"));