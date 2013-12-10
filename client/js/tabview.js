var Tabview = function Tabview (tabcontainer, pagecontainer) {
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
			this.parentNode.page.parentNode.removeChild(this.parentNode.page);
			this.parentNode.parentNode.removeChild(this.parentNode);
		}, false);
		
		tabcontainer.appendChild(tab);
		pagecontainer.appendChild(page);

		this.resize();
		
		return page;
	};
	
	this.resize = function () {
		console.log("resize");
		var pages = document.getElementsByClassName("page");
		for (var page = 0; page < pages.length; page++) {
			pages[page].style.minHeight = window.innerHeight - pages[page].offsetParent.offsetTop + "px";
		}
	};
	
	window.addEventListener("resize", this.resize);
};

var tabview = new Tabview(document.getElementById("tabcontainer"), document.getElementById("pagecontainer"));