const express = require("express");
const app = express();

// ✅ ADD THIS LINE
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});