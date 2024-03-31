import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

/*
It takes username, email and password from the req object then
it hashes the password and saves, username, hasedPassword and email in
database.
*/
router.post("/register", async (req, res) => {
	const { username, email, password, fullName } = req.body;

	if (!username || !email || !password || !fullName) {
		return res.status(400).json({ error: "some fields are empty" });
	}

	try {
		const existingUser = await User.findOne({ username: username });
		if (existingUser) {
			return res.status(400).json({ error: "user already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			username: username,
			email: email,
			password: hashedPassword,
			fullName: fullName,
		});

		await user.save();
		const token = jwt.sign(
			{ id: user._id, username: user.username },
			process.env.ACCESS_TOKEN_SECRET,
			{
				expiresIn: "1h",
			}
		);
		res.cookie("token", token, {
			httpOnly: true,
		});
		return res
			.status(200)
			.json({ message: "User registered Successfully" });
	} catch (err) {
		return res.status(400).json({ error: "Registration failed" });
	}
});

/*
The function will take the user details and then check if it is
a valid user, if it is a valid user then it will the create a token.
It is taking user._id as payload and encoding it into the JWT
ACCESS_TOKEN_SECRET is a secret key for signing the JWT
the token wil expire or become invalid in 1h
*/
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password)
			return res.status(400).json({ error: "Some fields are empty" });
		const user = await User.findOne({ username: username });
		if (!user) {
			return res.status(400).json({ error: "User doesn't exists" });
		}
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			return res.status(400).json({ error: "Wrong Password" });
		}
		const token = jwt.sign(
			{ id: user._id, username: user.username },
			process.env.ACCESS_TOKEN_SECRET,
			{
				expiresIn: "1h",
			}
		);
		res.cookie("token", token, {
			httpOnly: true,
		});
		res.json({ msg: "Login Successful", _id: user._id });
	} catch (err) {
		res.status(500).json({ error: "Login failed" });
	}
});
// route to logout
router.post("/logout", async (req, res) => {
	try {
		res.clearCookie("token");
		res.status(200).json({ msg: "logout successful" });
	} catch (err) {
		res.status(200).json({ msg: "No token present" });
	}
});
// route to check if user is still logged in
router.get("/check", async (req, res) => {
	const token = req.cookies.token;
	if (!token) return res.status(404).json({ error: "No token provided" });

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
		if (error) {
			return res.status(404).json({ error: "Token expired" });
		}
		const decodedId = decoded.id;
		User.findById(decodedId)
			.then((user) => {
				if (!user)
					return res.status(404).json({ error: "Invalid Token" });
				res.json({
					authenticated: true,
					user: {
						id: user._id,
						username: user.username,
					},
				});
			})
			.catch((err) => {
				res.status(500).json({ error: "some error" });
			});
	});
});
export default router;
