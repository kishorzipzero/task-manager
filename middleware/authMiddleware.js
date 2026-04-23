const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).send("Access Denied");

  try {
    const decoded = jwt.verify(token.split(" ")[1], "secretkey");
    req.user = decoded;
    next();
  } catch {
    res.status(400).send("Invalid Token");
  }
};