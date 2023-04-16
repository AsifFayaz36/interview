const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const cred = {
  host: 'localhost',
  user: 'root',
  password: 'your password',
  database: 'your database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

let columnName = null;
let tableName = null;

const pool = mysql.createPool(cred);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

let queryResponse = null;

app.get('/details', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>User Interface Screen</title>
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        form {
          position: absolute;
          top: 50%;
          left: 25%;
          transform: translateY(-50%);
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        input[type="text"] {
            border: 2px solid #696969;
            border-radius: 2px;
            padding: 8px;
            width: 35%;
            height: 40px;
            box-sizing: border-box;
          }
        button[type="submit"] {
            width: 25%;
            height: 40px;
        }
      </style>
    </head>
    <body>
      <form action="/submit" method="post">
        <input type="text" id="tablename" name="tablename" placeholder="Table Name"><br><br>
        <input type="text" id="uniquecolumn" name="uniquecolumn" placeholder="Unique Column"><br><br>
        <input type="text" id="columnname" name="columnname" placeholder="Column Name"><br><br>
        <button type="submit">Manual Update</button>
      </form> 
    </body>
  </html>
  `);
});

app.post('/submit', function (req, res) {
  let table;
  tableName = req.body.tablename;
  columnName = req.body.columnname;
  const query = `SELECT DISTINCT ${columnName} FROM ${tableName}`;
  pool.query(query, function (error, results, fields) {
    if (error) throw error;
    queryResponse = results;

    table = `<table><thead><tr><th>Table Name</th><th>Column Name</th><th>Distinct Value</th><th>User Input</th></tr></thead><tbody>`;

    for (let i = 0; i < results.length; i++) {
      table += `<tr><td>` + cred.database + `.` + tableName + `</td><td>` + columnName + `</td><td>` + results[i].city_name + `</td><td><input type="text" name="input` + i + `"></td></tr>`;
    }
    table += `</tbody></table>`;

    res.send(`<!DOCTYPE html>
    <html>
      <head>
        <title>User Interface Screen</title>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          form {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 50%;
            left: 25%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            border: 1px solid black;
          }
          th, td {
            text-align: left;
            padding: 8px;
            border: 1px solid black;
          }
          th {
            text-align: center;
            background-color: #f2f2f2;
          }
          input[type="text"] {
            border: 2px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            width: 100%;
            box-sizing: border-box;
          }
          button[type="submit"] {
            margin-top: 30px;
            width: 25%;
            height: 40px;
          }
        </style>
      </head>
      <body>
        <form action="/update" method="post">`
      + table +
      `<button type="submit">Update</button>
        </form>
      </body>
    </html>`);
  });
});

app.post('/update', (req, res) => { 
  const reqBody = req.body;
  var i = 0;

  for (const key in reqBody) {
    if (reqBody[key] === "" || reqBody[key] === null) {
      i++;
      continue;
    }
    const query = `UPDATE ${tableName} SET city_name = '${reqBody[key]}' WHERE city_name = '${queryResponse[i].city_name}';`;
    i++;
    pool.query(query, function (error, results, fields) {
      if (error) throw error;
      console.log(results.affectedRows + " record(s) updated");
      res.write(`<html><h3>Completed</h3></html>`);
      res.end();
    });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});