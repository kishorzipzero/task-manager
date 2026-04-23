const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password, role, organization_id } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password,role,organization_id) VALUES (?,?,?,?,?)",
    [name, email, hashedPassword, role, organization_id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("User Registered");
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (result.length === 0) return res.status(400).send("User not found");

    const user = result[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).send("Invalid password");

    const token = jwt.sign(
      { id: user.id, orgId: user.organization_id, role: user.role },
      "secretkey"
    );

    res.json({ token });
  });
};