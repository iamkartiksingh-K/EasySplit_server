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
  if (!name)
    return res.status(400).json({ message: "Group name cannot be empty" });
  members.push({ userId: req.user.id, username: req.user.username });
  const balances = members.map((member) => {
    return {
      userId: member.userId,
      username: member.username,
      youOwe: 0,
      youAreOwed: 0,
    };
  });
  const newGroup = new Group({
    name,
    members,
    balances,
    cover,
    admin: req.user.id,
  });
  try {
    await newGroup.save();
    const data = {
      cover: newGroup.cover,
      _id: newGroup._id,
      name: newGroup.name,
      memberCount: newGroup.members.length,
      balance: newGroup.balances.find((balance) =>
        balance.userId.equals(req.user.id),
      ),
    };
    res.json({ message: "Group added", data: data });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Unable to save group" });
  }
});
// get all the groups of which the logged in user is part of
router.get("/", verifyToken, async (req, res) => {
  try {
    const groups = await Group.find({ "members.userId": req.user.id });
    const processdGroups = groups.map(
      ({ cover, _id, name, members, balances }) => {
        return {
          cover,
          _id,
          name,
          memberCount: members.length,
          balance: balances.find((balance) =>
            balance.userId.equals(req.user.id),
          ),
        };
      },
    );
    res.json({
      message: "groups retrieved successfully",
      data: processdGroups,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to retrieve groups" });
  }
});
// get a specific group
router.get("/:groupId", verifyToken, async (req, res) => {
  const id = req.params.groupId;
  Group.findById(id)
    .then((result) => {
      if (!result) {
        return res.status(404).json({ message: "group not found" });
      }
      res.status(200).json({ message: "group found", data: result });
    })
    .catch((err) => {
      res.status(500).json({ message: "some error" });
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
  try {
    console.log("update object:", updateObject);
    const result = await Group.findOneAndUpdate(
      { _id: id },
      {
        $set: updateObject,
      },
      { new: true },
    );
    console.log(result);
    res.json({ message: "group updated", data: result });
  } catch (error) {
    res.status(500).json({ message: "Unable to update group" });
  }
});
// delete a group
router.delete("/:groupId", verifyToken, async (req, res) => {
  const id = req.params.groupId;
  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "group not found" });
    if (!group.admin.equals(req.user.id))
      return res
        .status(400)
        .json({ message: "Only admin can delete the group" });
    await Expense.deleteMany({ "group.groupId": id });
    await Group.deleteOne({ _id: id });
    res.json({ message: "group deleted" });
  } catch (err) {
    res.status(500).json({ message: "Unable to delete group" });
  }
});
// get info of all users
router.post("/:groupId/memberInfo", verifyToken, async (req, res) => {
  const userIds = req.body.memberInfo.map((member) => {
    return member.userId;
  });
  User.find({ _id: { $in: userIds } })
    .then((result) => {
      res.json({ message: "Users found", data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: "Unable to get the list of users",
      });
    });
});
// add a member to a group
router.post("/:groupId/members", verifyToken, async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "group not found" });
    if (group.members.find((member) => member.username === username))
      return res.status(400).json({ message: "user already in the group" });

    group.members.push({ userId: user._id, username });
    if (
      group.balances.find((balance) => balance.username === username) ===
      undefined
    )
      group.balances.push({
        userId: user._id,
        username: username,
        youOwe: 0,
        youAreOwed: 0,
      });
    await group.save();
    return res.json({
      message: "member added",
      data: group,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to add memeber" });
  }
});
// route to remove a member from group
router.post("/:groupId/removeMember", verifyToken, async (req, res) => {
  const { userToRemove } = req.body;
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group.admin.equals(req.user.id))
      return res.status(401).json({ message: "Only admin can remove members" });
    const newMembers = group.members.filter(
      (member) => !member.userId.equals(userToRemove),
    );
    group.members = newMembers;
    await group.save();
    res.json({ message: "User removed", data: group });
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
});
// route to leave group
router.post("/:groupId/leave", verifyToken, async (req, res) => {
  const userToRemove = req.user.id;
  try {
    const group = await Group.findById(req.params.groupId);
    const newMembers = group.members.filter(
      (member) => !member.userId.equals(userToRemove),
    );
    if (newMembers.length === 0) {
      await Expense.deleteMany({ "group.groupId": req.params.groupId });
      await Group.deleteOne({ _id: req.params.groupId });
      return res.json({
        message: "Group removed as there are no members left",
      });
    }
    if (group.admin.equals(userToRemove)) {
      const index = Math.floor(Math.random() * newMembers.length);
      group.admin = newMembers[index].userId;
    }
    group.members = newMembers;
    await group.save();
    res.json({ message: "You left the group", data: group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});
// route to get transactions to make to settle expenses
router.get("/:groupId/getMinTransactions", verifyToken, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const result = await Group.findById(groupId);

    if (!result) {
      return res.status(404).json({ error: "Group not found" });
    }

    const amount = result.balances.map((balance) => ({
      username: balance.username,
      balance: balance.youAreOwed - balance.youOwe,
    }));

    const nonZeroBalance = amount.filter((user) => user.balance !== 0);

    if (nonZeroBalance.length === 0) {
      return res.json({ data: [] }); // No transactions needed
    }

    const transactions = [];
    minTransaction(nonZeroBalance, transactions);

    res.json({ data: transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Some error occurred" });
  }
});

// route to settle debt
router.post("/:groupId/settle", verifyToken, async (req, res) => {
  const { from, to, amount } = req.body;
  const groupId = req.params.groupId;
  try {
    const group = await Group.findById(groupId);
    group.balances = group.balances.map((balance) => {
      if (balance.username === from) {
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
      if (balance.username === to) {
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
    await group.save();
    res.json({ message: "settled!", data: group });
  } catch (error) {
    res.json({ message: "unable to settle debt" });
  }
});
export default router;
