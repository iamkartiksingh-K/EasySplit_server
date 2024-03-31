import mongoose from "mongoose";
const expenseSchema = mongoose.Schema({
	description: { type: String, required: true },
	amount: { type: Number, required: true },
	date: { type: Date },
	paidBy: {
		type: {
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			username: {
				type: String,
			},
		},
		required: true,
	},
	group: {
		type: {
			groupId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Group",
			},
			groupName: {
				type: String,
			},
		},
		required: true,
	},
	split: {
		type: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				username: { type: String, default: "default" },
				amount: { type: Number },
			},
		],
		required: true,
	},
});
const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
