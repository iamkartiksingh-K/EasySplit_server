import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";
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
// serach for a user based no objectId
router.get("/search/:userId", verifyToken, async (req, res) => {
	User.findById(req.params.userId)
		.select("-password")
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			res.json({ error: err });
		});
});
export default router;
