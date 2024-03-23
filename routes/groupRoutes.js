import express from "express";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

// create a group
router.post("/", verifyToken, async (req, res) => {
	const { name, members } = req.body;
	members.push(req.user.id);
	const newGroup = new Group({
		name,
		members,
	});
	Group.findOne({ name })
		.then((result) => {
			if (result) {
				res.json({ error: "Group already Exists" });
			} else {
				newGroup.save();
				res.json({ message: "Group added", data: newGroup });
			}
		})
		.catch((err) => {
			res.status(400).json({ error: err });
		});
});
// get all the groups of which the logged in user is part of
router.get("/", verifyToken, async (req, res) => {
	Group.find({ members: req.user.id })
		.then((groups) => {
			res.json(groups);
		})
		.catch((err) => {
			res.status(500).json({ error: err });
		});
});
// get a specific group
router.get("/:groupId", verifyToken, async (req, res) => {
	const id = req.params.groupId;
	Group.findById(id)
		.then((result) => {
			if (!result) {
				return res.status(404).json({ error: "group not found" });
			}
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: "some error" });
		});
});
// add a member to a group
router.post("/:groupId/members", verifyToken, async (req, res) => {
	const { userId } = req.body;
	Group.findById(req.params.groupId)
		.then((result) => {
			if (!result)
				return res.status(404).json({ error: "group not found" });
			if (result.members.includes(userId))
				return res.json({ error: "user alread exists" });
			result.members.push(userId);
			result.save();
			res.json({ msg: "member added" });
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
// remove a member from a group
router.delete("/:groupId/members", verifyToken, async (req, res) => {
	const { userId } = req.body;
	Group.findById(req.params.groupId)
		.then((result) => {
			if (!result)
				return res.status(404).json({ error: "group not found" });
			if (!result.members.includes(userId))
				return res.json({ error: "user doesn't exists" });
			let idx = result.members.indexOf(userId);
			result.members.splice(idx, 1);
			result.save();
			res.json({ msg: "member removed" });
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
// route to add an expense
router.post("/:groupId/expenses", verifyToken, async (req, res) => {
	try {
		const group = req.params.groupId;
		const { description, amount, date, paidBy, split } = req.body;
		const expense = new Expense({
			description,
			amount,
			date,
			paidBy,
			group,
			split,
		});
		await expense.save();
		Group.findById(group)
			.then((result) => {
				result.expenses.push(expense._id);
				result.save();
				res.json({ msg: "expense added" });
			})
			.catch((err) => {
				res.json({ error: "cannot find group" });
			});
	} catch (err) {
		res.json({ error: err });
	}
});

export default router;
