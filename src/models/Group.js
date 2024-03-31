import mongoose from "mongoose";
const groupSchema = mongoose.Schema({
	name: { type: String, required: true, trim: true },
	cover: { type: String },
	members: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			username: {
				type: String,
				default: "default username",
			},
		},
	],
	balances: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
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
const Group = mongoose.model("Group", groupSchema);
export default Group;
