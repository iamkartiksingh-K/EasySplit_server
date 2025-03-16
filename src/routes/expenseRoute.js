import express from "express";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import verifyToken from "../middleware/authMiddleware.js";
const router = express.Router();

// get all the expenses of logged in user
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.id;
  Expense.find({ "split.userId": userId })
    .then((result) => {
      res.json({ data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ message: "some error occurred" });
    });
});
// create an expense
router.post("/", verifyToken, async (req, res) => {
  try {
    const { description, amount, date, paidBy, group, split } = req.body.data;
    const expense = new Expense({
      description,
      amount,
      date,
      paidBy,
      group,
      split,
    });
    await expense.save();
    const result = await Group.findById(group.groupId);
    const updatedBalance = result.balances.map((balance) => {
      if (balance.userId.equals(paidBy.userId)) {
        return {
          ...balance,
          youAreOwed:
            balance.youAreOwed +
              amount -
              split.find((s) => s.userId === paidBy.userId)?.amount || 0,
        };
      }
      return {
        ...balance,
        youOwe:
          balance.youOwe +
            split.find((s) => balance.userId.equals(s.userId))?.amount || 0,
      };
    });
    result.balances = updatedBalance;
    await result.save();
    res.json({ msg: "Expense Saved", data: expense });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to save expense" });
  }
});

// delete an expense
router.delete("/:groupId/:id", verifyToken, async (req, res) => {
  try {
    console.log("hii");
    const { groupId, id } = req.params;
    console.log(id);
    const result = await Group.findById(groupId);
    const { split, paidBy, amount } = await Expense.findById(id);
    // console.log(expense);
    const updatedBalance = result.balances.map((balance) => {
      if (balance.userId.equals(paidBy.userId)) {
        return {
          ...balance,
          youAreOwed:
            balance.youAreOwed -
            (amount -
              split.find((s) => s.userId.equals(paidBy.userId))?.amount || 0),
        };
      }
      return {
        ...balance,
        youOwe:
          balance.youOwe -
            split.find((s) => balance.userId.equals(s.userId))?.amount || 0,
      };
    });
    result.balances = updatedBalance;
    await result.save();
    await Expense.findByIdAndDelete(id);
    res.json({ msg: "Expense deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to delete expense" });
  }
});

// get all expenses realted to group
router.get("/:groupId/getAllExpenses", verifyToken, async (req, res) => {
  const groupId = req.params.groupId;
  Expense.find({ "group.groupId": groupId })
    .then((result) => {
      res.json({ data: result });
    })
    .catch((error) => {
      console.log("Unable to retrieve expenses", error);
      res.status(500).json({ message: "Unable to retrieve expenses" });
    });
});

export default router;
