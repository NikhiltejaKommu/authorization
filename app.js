const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Registering User

app.post("/register/", async (request, response) => {
  const userProvidedDetails = request.body;

  const { username, name, password, gender, location } = userProvidedDetails;
  const hashedPassword = bcrypt.hash(password, 10);
  const verifyQuery = ` SELECT * FROM user WHERE username = "${username}"`;
  const dbDetail = await db.get(verifyQuery);
  if (dbDetail === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const registeringQuery = `
        INSERT INTO 
        user (username,name,password,gender,location)
        VALUES ("${username}","${name}","${hashedPassword}","${gender}","${location}")
      `;
      const registration = await db.run(registeringQuery);
      response.send("User created successfully");
    }
  } else {
    response.send("User already exists");
    response.status(400);
  }
});

// User trying to login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const verifyingUsername = `SELECT * FROM user WHERE username = "${username}"`;
  const userDB = await db.get(verifyingUsername);
  if (userDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, userDB.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// Change password

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const gettingDBQuery = `SELECT * FROM user WHERE username = "${username}"`;
  const userDB = await db.get(gettingDBQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, userDB.password);
  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
