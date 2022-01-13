const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
app.use(express.json());

const dBPath = path.join(__dirname, "userData.db");
let database = null;

const initializedBAndServer = async () => {
  try {
    database = await open({
      filename: dBPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializedBAndServer();

// Register User API

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `
    SELECT 
        *
    FROM 
        user
    WHERE 
        username = '${username}';
  `;
    const dbUser = await database.get(selectUserQuery);

    if (dbUser === undefined) {
      const createUserQuery = `
      INSERT INTO user(
        username,
        name,
        password,
        gender,
        location
      )
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );
    `;
      await database.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

// Login User API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT 
        *
    FROM 
        user
    WHERE
        username = '${username}';
  `;
  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// Change Password API

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `
    SELECT 
        *
    FROM
        user
    WHERE
        username = '${username}';
  `;
  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isOldPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isOldPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE 
                user
            SET
                password = '${hashedPassword}'
            WHERE
                username = '${username}';    
        `;
        await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});

module.exports = app;
