import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
const router = express.Router();

// search for a user in database by giving username or email as a query
router.get("/search/:usernameOrEmail", verifyToken, async (req, res) => {
	const usernameOrEmail = req.params.usernameOrEmail;
	User.findOne({
		$or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
	})
		.select("-password")
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
export default router;
