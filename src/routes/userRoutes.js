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
			console.log(result);
			if (result === null)
				return res.status(404).json({ message: "user not found" });
			return res.json({ message: "user found", data: result });
		})
		.catch((error) => {
			console.log("unable to search user", error);
			return res.status(500).json({ message: "some error occurred" });
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
