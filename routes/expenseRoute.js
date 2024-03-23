import express from "express";
import Expense from "../models/Expense.js";
import verifyToken from "../middleware/authMiddleware.js";
const router = express.Router();

// get all the expenses of logged in user
router.get("/", verifyToken, async (req, res) => {
	const userId = req.user.id;
	Expense.find({ paidBy: userId })
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
// get specific expense
router.get("/:expenseId", verifyToken, async (req, res) => {
	const expenseId = req.params.expenseId;
	Expense.find({ _id: expenseId })
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
export default router;
