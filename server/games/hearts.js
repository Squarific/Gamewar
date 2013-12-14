module.exports = function Hearts () {
	this.settings = {
		players: {
			type: "number"
			min: 3,
			max: 5,
			label: "Players",
			info: "How many players will be playing the game?"
			default: 4
		},
		endPoints: {
			type: "number",
			min: 0,
			max: 300,
			label: "End points",
			info: "When is the game over? This has a huge influence over how long the game will take.",
			default: 100
		},
		betAmount: {
			type: "number"
			min: 0,
			max: Infinity,
			label: "Bet amount",
			info: "How much do you want to bet?"
			default: 0
		}
	}
};