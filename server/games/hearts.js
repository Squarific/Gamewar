module.exports = function Hearts (mysql) {
	this.name = "Hearts (black lady)";
	this.settings = {
		players: {
			type: "number",
			input: {
				min: 3,
				max: 5
			}
		},
		endPoints: {
			type: "number",
			input: {
				min: 0,
				max: 300
			}
		},
		betAmount: {
			type: "number",
			input: {
				min: 0,
				max: Infinity
			}
		}
	};
};