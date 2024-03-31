import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { Types } from "mongoose";
const router = Router();

router.get("/", verifyToken, (req, res) => {
	const userId = new Types.ObjectId(req.user.id);
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		connection: "keep-alive",
		"cache-control": "no-cache",
		"access-control-allow-origin": "http://localhost:5173",
	});
	res.flushHeaders();

	const database = mongoose.connection.db;

	const groupChangeStream = database.collection("groups").watch();
	const expenseChangeStream = database.collection("expenses").watch();

	groupChangeStream.on("change", (change) => {
		console.log(change.fullDocument.members.includes(userId));
		console.log(userId);
		const isUserInMembers = change.fullDocument.members.some((memberId) =>
			memberId.equals(userId)
		);
		if (change.fullDocument && isUserInMembers) {
			const data = JSON.stringify(change.fullDocument);
			res.write(`data: {"newGroup": ${data}}\n\n`);
		} else {
			res.write("data: {}\n\n");
		}
	});
	expenseChangeStream.on("change", (change) => {
		const isUserInSplit = change.fullDocument.split.some((memberId) =>
			memberId.equals(userId)
		);
		if (
			(change.fullDocument && isUserInSplit()) ||
			change.fullDocument.paidBy.equals(userId)
		) {
			const data = JSON.stringify(change.fullDocument);
			res.write(`data: {"newGroup": ${data}}\n\n`);
		} else {
			res.write("data: {}\n\n");
		}
	});

	res.on("close", () => {
		groupChangeStream.close();
		expenseChangeStream.close();
		res.end();
	});
});

export default router;
