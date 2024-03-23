import mongoose from "mongoose";
const expenseSchema = mongoose.Schema({
	description: { type: String, required: true },
	amount: { type: Number, required: true },
	date: { type: Date },
	paidBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	group: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Group",
		required: true,
	},
	split: {
		type: [
			{
				user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				amount: { type: Number, required: true },
			},
		],
		required: true,
	},
});
const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
