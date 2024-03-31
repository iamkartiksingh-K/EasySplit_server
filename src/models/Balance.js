import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	groupBalances: [
		{
			groupId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Group",
				required: true,
			},
			youOwe: {
				type: Number,
				default: 0,
			},
			youAreOwed: {
				type: Number,
				default: 0,
			},
		},
	],
});

const Balance = mongoose.model("Balance", balanceSchema);
export default Balance;
