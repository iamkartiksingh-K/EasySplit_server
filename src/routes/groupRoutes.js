import express from "express";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import verifyToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import minTransaction from "../utils/minTransactions.js";
const router = express.Router();

// create a group
router.post("/", verifyToken, async (req, res) => {
	const { name, members, cover } = req.body;
	if (!name) return res.json({ error: "Empty Group Name" });
	members.push({ userId: req.user.id, username: req.user.username });
	const balances = members.map((member) => {
		return { userId: member.userId, youOwe: 0, youAreOwed: 0 };
	});
	const newGroup = new Group({
		name,
		members,
		balances,
		cover,
	});
	try {
		newGroup.save();
		res.json({ message: "Group added", data: newGroup });
	} catch (err) {
		res.status(400).json({ error: err });
	}
});
// get all the groups of which the logged in user is part of
router.get("/", verifyToken, async (req, res) => {
	Group.find({ "members.userId": req.user.id })
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
// update a specific group
router.put("/:groupId", verifyToken, async (req, res) => {
	const id = req.params.groupId;
	const { cover, groupName } = req.body;
	const updateObject = {};
	if (cover) {
		updateObject.cover = cover;
	}
	if (groupName) {
		updateObject.name = groupName;
	}
	Group.findByIdAndUpdate(id, {
		$set: updateObject,
	})
		.then((result) => {
			res.json({ msg: "group updated" });
		})
		.catch((err) => {
			res.json({ error: "cannot update group" });
		});
});
// delete a group
router.delete("/:groupId", async (req, res) => {
	const id = req.params.groupId;
	try {
		await Expense.deleteMany({ "group.groupId": id });
		await Group.deleteOne({ _id: id });
		res.json({ msg: "group deleted" });
	} catch (err) {
		res.status(500).json({ error: err });
	}
});
// get info of all users
router.post("/:groupId/memberInfo", verifyToken, async (req, res) => {
	const userIds = req.body.memberInfo.map((member) => {
		return member.userId;
	});
	User.find({ _id: { $in: userIds } })
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
// add a member to a group
router.post("/:groupId/members", verifyToken, async (req, res) => {
	const { username } = req.body;
	User.findOne({ username: username })
		.then((result) => {
			console.log(result);
			if (result) {
				const userId = result._id;
				Group.findById(req.params.groupId).then((result) => {
					if (!result)
						return res
							.status(404)
							.json({ error: "group not found" });
					if (result.members.includes(userId))
						return res
							.status(400)
							.json({ error: "user alread exists" });
					result.members.push({ userId, username });
					result.balances.push({ userId, youOwe: 0, youAreOwed: 0 });
					result.save();
					res.json({ msg: "member added" });
				});
			}
		})
		.catch((err) => {
			res.json({ error: "Server Error" });
		});
});

// route to get transactions to make to settle expenses
router.get("/:groupId/getMinTransactions", verifyToken, async (req, res) => {
	const groupId = req.params.groupId;
	Group.findById(groupId)
		.then((result) => {
			if (!result)
				return res.status(404).json({ error: "group not found" });
			const amount = result.balances.map((balance) => {
				return {
					userId: balance.userId,
					balance: balance.youAreOwed - balance.youOwe,
				};
			});
			// console.log(amount);
			const transactions = [];
			minTransaction(amount, transactions);
			res.json({ data: transactions });
		})
		.catch((err) => {
			res.status(500).json({ err: err });
		});
});
// route to settle debt
router.post("/:groupId/settle", verifyToken, async (req, res) => {
	const { from, to, amount } = req.body;
	const groupId = req.params.groupId;
	Group.findById(groupId)
		.then((group) => {
			group.balances = group.balances.map((balance) => {
				if (balance.userId.equals(from)) {
					const tempBalance = balance.youOwe - amount;
					if (tempBalance === balance.youAreOwed) {
						return {
							...balance,
							youAreOwed: 0,
							youOwe: 0,
						};
					}
					return {
						...balance,
						youOwe: tempBalance,
					};
				}
				if (balance.userId.equals(to)) {
					const tempBalance = balance.youAreOwed - amount;
					if (tempBalance === balance.youOwe) {
						return {
							...balance,
							youAreOwed: 0,
							youOwe: 0,
						};
					}
					return {
						...balance,
						youAreOwed: tempBalance,
					};
				}
				return balance;
			});
			group.save();
			res.json({ data: "Settled" });
		})
		.catch((err) => {
			console.log(err);
			res.json({ error: err });
		});
});
export default router;
