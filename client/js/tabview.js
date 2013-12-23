var Tabview = function Tabview (tabcontainer, pagecontainer) {
	while (tabcontainer.firstChild) {
		tabcontainer.removeChild(tabcontainer.firstChild);
	}
	while (pagecontainer.firstChild) {
		pagecontainer.removeChild(pagecontainer.firstChild);
	}

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
			var tabContainer = (event.target.parentNode.classList.contains("active")) ? event.target.parentNode.parentNode : {};
			event.target.parentNode.page.parentNode.removeChild(event.target.parentNode.page);
			event.target.parentNode.parentNode.removeChild(event.target.parentNode);
			this.activate(tabContainer.firstChild);
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
		if (target.tab) {
			target = target.tab;
		}
		var tabContainer = target.parentNode;
		target.page.parentNode.removeChild(target.page);
		target.parentNode.removeChild(target);
		this.activate(tabContainer.firstChild);
	};
	
	this.changeTitle = function (target, title) {
		if (target.tab) {
			target = target.tab;
		}
		while (target.firstChild) {
			target.removeChild(target.firstChild);
		}
		target.appendChild(document.createTextNode(title));
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
		this.resize();
	};
	
	window.addEventListener("resize", this.resize);
};

var tabview = new Tabview(document.getElementById("tabcontainer"), document.getElementById("pagecontainer"));