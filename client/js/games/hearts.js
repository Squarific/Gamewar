var GameWar = GameWar || {};
GameWar.prototype.games = GameWar.prototype.games || {};
GameWar.prototype.games.Hearts = function Hearts () {
	this.description = "Hearts (black lady) game.";
	this.name = "Hearts (black lady)";
	this.settings = {
		players: {
			type: "number",
			input: {
				min: 3,
				max: 5,
				value: 4
			},
			label: "Players",
			info: "How many players will be playing the game?"
		},
		endPoints: {
			type: "number",
			input: {
				min: 0,
				max: 300,
				value: 100
			},
			label: "End points",
			info: "When is the game over? This has a huge influence over how long the game will take."
		},
		betAmount: {
			type: "number",
			input: {
				min: 0,
				max: Infinity,
				value: 0
			},
			label: "Bet amount",
			info: "How much do you want to bet?"
		},
		maxDecisionTime: {
			type: "number",
			input: {
				min: 0,
				max: 1440,
				value: 2
			},
			label: "Maximum decision time (minutes)",
			info: "Maximum amount of minutes someone has to make a decision"
		}
	};
};