import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
	const token = req.cookies.token;
	if (!token) {
		return res.status(401).json({ error: "Access denied" });
	}
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.status(403).json({ error: "invalid token" });
		req.user = user;
		next();
	});
}
export default verifyToken;
