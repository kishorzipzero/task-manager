const db = require("../config/db");

// ✅ CREATE TASK
exports.createTask = (req, res) => {
  console.log("User:", req.user);
  console.log("Body:", req.body);

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send("Title and Description required");
  }

  db.query(
    "INSERT INTO tasks (title,description,created_by,organization_id,status) VALUES (?,?,?,?,?)",
    [title, description, req.user.id, req.user.orgId, "pending"],
    (err, result) => {
      if (err) return res.status(500).send(err);

      // ✅ Audit Log
      db.query(
        "INSERT INTO task_logs (task_id, action, performed_by) VALUES (?,?,?)",
        [result.insertId, "CREATED", req.user.id]
      );

      res.send("Task Created");
    }
  );
};

// ✅ GET TASKS (Tenant Isolation + RBAC)
exports.getTasks = (req, res) => {
  if (req.user.role === "admin") {
    db.query(
      "SELECT * FROM tasks WHERE organization_id=?",
      [req.user.orgId],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
  } else {
    db.query(
      "SELECT * FROM tasks WHERE created_by=? AND organization_id=?",
      [req.user.id, req.user.orgId],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
  }
};

// ✅ UPDATE TASK
exports.updateTask = (req, res) => {
  const taskId = req.params.id;

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send("Title and Description required");
  }

  db.query("SELECT * FROM tasks WHERE id=?", [taskId], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).send("Task not found");
    }

    const task = result[0];

    // ✅ RBAC check
    if (
      req.user.role !== "admin" &&
      task.created_by !== req.user.id
    ) {
      return res.status(403).send("Forbidden");
    }

    db.query(
      "UPDATE tasks SET title=?, description=? WHERE id=?",
      [title, description, taskId],
      (err) => {
        if (err) return res.status(500).send(err);

        // ✅ Audit Log
        db.query(
          "INSERT INTO task_logs (task_id, action, performed_by) VALUES (?,?,?)",
          [taskId, "UPDATED", req.user.id]
        );

        res.send("Task Updated");
      }
    );
  });
};

// ✅ DELETE TASK
exports.deleteTask = (req, res) => {
  const taskId = req.params.id;

  // ✅ Only admin can delete
  if (req.user.role !== "admin") {
    return res.status(403).send("Only admin can delete");
  }

  db.query("SELECT * FROM tasks WHERE id=?", [taskId], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).send("Task not found");
    }

    db.query("DELETE FROM tasks WHERE id=?", [taskId], (err) => {
      if (err) return res.status(500).send(err);

      // ✅ Audit Log
      db.query(
        "INSERT INTO task_logs (task_id, action, performed_by) VALUES (?,?,?)",
        [taskId, "DELETED", req.user.id]
      );

      res.send("Task Deleted");
    });
  });
};