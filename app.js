// Imports --------------------------------------
import express from "express";
import cors from "cors";
import database from "./database.js";

// Configure express app ------------------------
const app = new express();

// Configure middleware -------------------------
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

app.use(cors({ origin: "*" }));

// Controllers ----------------------------------
// Examples to help understand basics:
const helloController = (req, res) => res.send("Hi Harsha!");

const addController = (req, res) => {
  const var1 = req.params.var1;
  const var2 = req.params.var2;
  const result = {
    operation: "addition",
    operand1: var1,
    operand2: var2,
    result: parseInt(var1) + parseInt(var2),
    message: "Have a great day",
  };
  res.json(result);
};

// Actual DB controllers:
const subjectsController = async (req, res) => {
  const id = req.params.id; // Undefined in the case of the /api/subjects endpoint
  // Build SQL
  const table =
    "(Subjects LEFT JOIN Users ON Subjects.SubjectLecturerID=Users.UserID)";
  const whereField = "SubjectID";
  const fields = [
    "SubjectID",
    "SubjectName",
    "SubjectImageURL",
    "SubjectLecturerID",
    "Users.UserName AS SubjectLecturerName",
  ];
  const extendedTable = `${table}`;
  const extendedFields = `${fields}`;
  let sql = `SELECT ${extendedFields} FROM ${extendedTable}`;

  if (id) sql += ` WHERE ${whereField} = ${id}`;

  // Execute query
  let isSuccess = false;
  let message = "";
  let result = null;
  try {
    [result] = await database.query(sql);
    if (result.length === 0) message = "No record(s) found";
    else {
      isSuccess = true;
      message = "Record(s) successfully recovered";
    }
  } catch (error) {
    message = `Failed to execute query: ${error.message}`;
  }

  // Responses
  isSuccess ? res.status(200).json(result) : res.status(400).json({ message });
};

const subjectsOfLecturerController = async (req, res) => {
  const id = req.params.id;
  // Build SQL
  const table =
    "(Subjects LEFT JOIN Users ON Subjects.SubjectLecturerID=Users.UserID)";
  const whereField = "SubjectLecturerID";
  const fields = [
    "SubjectID",
    "SubjectName",
    "SubjectImageURL",
    "SubjectLecturerID",
    "Users.UserName AS SubjectLecturerName",
  ];
  const extendedTable = `${table}`;
  const extendedFields = `${fields}`;
  const sql = `SELECT ${extendedFields} FROM ${extendedTable} WHERE ${whereField} = ${id}`;

  // Execute query
  let isSuccess = false;
  let message = "";
  let result = null;
  try {
    [result] = await database.query(sql);
    if (result.length === 0) message = "No record(s) found";
    else {
      isSuccess = true;
      message = "Record(s) successfully recovered";
    }
  } catch (error) {
    message = `Failed to execute query: ${error.message}`;
  }

  // Responses
  isSuccess ? res.status(200).json(result) : res.status(400).json({ message });
};

const subjectsOfUserController = async (req, res) => {
  const id = req.params.id;
  // Build SQL
  const table =
    "(Subjects LEFT JOIN Users ON Subjects.SubjectLecturerID=Users.UserID)";
  const whereField = "Userenrollment.UserenrollmentUserID";
  const fields = [
    "SubjectID",
    "SubjectName",
    "SubjectImageURL",
    "SubjectLecturerID",
    "Users.UserName AS SubjectLecturerName",
  ];
  const extendedTable = `Userenrollment INNER JOIN ${table} ON Userenrollment.UserenrollmentSubjectID = Subjects.SubjectID`;
  const extendedFields = `${fields}`;
  const sql = `SELECT ${extendedFields} FROM ${extendedTable} WHERE ${whereField} = ${id}`;

  // Execute query
  let isSuccess = false;
  let message = "";
  let result = null;
  try {
    [result] = await database.query(sql);
    if (result.length === 0) message = "No record(s) found";
    else {
      isSuccess = true;
      message = "Record(s) successfully recovered";
    }
  } catch (error) {
    message = `Failed to execute query: ${error.message}`;
  }

  // Responses
  isSuccess ? res.status(200).json(result) : res.status(400).json({ message });
};

// Endpoints ------------------------------------
// Examples to help understand basics:
app.get("/hello", helloController);
app.get("/add/:var1,:var2", addController);

// Actual DB endpoints:
app.get("/api/subjects", subjectsController);
app.get("/api/subjects/:id", subjectsController);
app.get("/api/subjects/lecturer/:id", subjectsOfLecturerController);
app.get("/api/subjects/users/:id", subjectsOfUserController);

//Alternative endpoint syntax:
app.get("/api/users/:id/subjects", subjectsOfUserController);

// Start Server ---------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
