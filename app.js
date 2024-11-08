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
const buildSubjectsSelectSql = (id, variant) => {
  let sql = "";

  const table =
    "(Subjects LEFT JOIN Users ON Subjects.SubjectLecturerID=Users.UserID)";
  const fields = [
    "SubjectID",
    "SubjectName",
    "SubjectImageURL",
    "SubjectLecturerID",
    "Users.UserName AS SubjectLecturerName",
  ];

  switch (variant) {
    case "lecturer":
      sql = `SELECT ${fields} FROM ${table} WHERE SubjectLecturerID=${id}`;
      break;
    case "users":
      const extendedTable = `Userenrollment INNER JOIN ${table} ON Userenrollment.UserenrollmentSubjectID = Subjects.SubjectID`;
      sql = `SELECT ${fields} FROM ${extendedTable} WHERE Userenrollment.UserenrollmentUserID=${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE SubjectID=${id}`;
  }

  return sql;
};

const read = async (selectSql) => {
  try {
    const [result] = await database.query(selectSql);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No record(s) found" }
      : {
          isSuccess: true,
          result: result,
          message: "Record(s) successfully recovered",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const getSubjectsController = async (req, res, variant) => {
  const id = req.params.id; // Undefined in the case of the /api/subjects endpoint

  // Access data
  const sql = buildSubjectsSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message });

  // Responses
  res.status(200).json(result);
};

// Endpoints ------------------------------------
// Examples to help understand basics:
app.get("/hello", helloController);
app.get("/add/:var1,:var2", addController);

// Actual DB Subject endpoints:
app.get("/api/subjects", (req, res) => getSubjectsController(req, res, null));
app.get("/api/subjects/:id", (req, res) =>
  getSubjectsController(req, res, null)
);
app.get("/api/subjects/lecturer/:id", (req, res) =>
  getSubjectsController(req, res, "lecturer")
);
app.get("/api/subjects/users/:id", (req, res) =>
  getSubjectsController(req, res, "users")
);

//Alternative endpoint syntax:
app.get("/api/users/:id/subjects", (req, res) =>
  getSubjectsController(req, res, null)
);

// Start Server ---------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
