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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );

const buildSubjectsInsertSql = (record) => {
  let table = "Subjects";
  const mutableFields = ["SubjectName", "SubjectImageURL", "SubjectLecturerID"];

  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};

const buildSubjectsUpdateSql = () => {
  let table = "Subjects";
  const mutableFields = ["SubjectName", "SubjectImageURL", "SubjectLecturerID"];

  return (
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE SubjectID=:SubjectID`
  );
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

const create = async (sql, record) => {
  try {
    const status = await database.query(sql, record);
    const recoverRecordSql = buildSubjectsSelectSql(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverRecordSql);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
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

const postSubjectsController = async (req, res) => {
  // Access data
  const sql = buildSubjectsInsertSql(req.body);
  const { isSuccess, result, message } = await create(sql, req.body);
  if (!isSuccess) return res.status(404).json({ message });

  // Responses
  res.status(201).json(result);
};

const putSubjectsController = async (req, res) => {
  // Validate request
  const id = req.params.id;
  const record = req.body;
  // Access data
  const sql = buildSubjectsUpdateSql();
  const { isSuccess, result, message } = await create(sql, req.body);
  if (!isSuccess) return res.status(404).json({ message });

  // Responses
  res.status(201).json(result);
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

app.post("/api/subjects", postSubjectsController);

app.put("/api/subjects/:id", putSubjectsController);

//Alternative endpoint syntax:
app.get("/api/users/:id/subjects", (req, res) =>
  getSubjectsController(req, res, null)
);

// Start Server ---------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
