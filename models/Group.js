import mongoose from "mongoose";
const groupSchema = mongoose.Schema({
	name: { type: String, required: true, trim: true },
	members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	],
	expenses: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Expense",
		},
	],
});
const Group = mongoose.model("Group", groupSchema);
export default Group;
