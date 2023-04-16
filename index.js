const express = require('express');
const mysql = require('mysql');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your password',
    database: 'your database',
});

// Check websites every 2 minutes
setInterval(() => {
    console.log("2 minutes check started");
    db.query('SELECT * FROM websites', (err, results) => {
        if (err) throw err;

        results.forEach(async (website) => {
            try {
                const response = await axios.get(website.url);
                const status = response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'FAILURE';
                const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
                if (website.status !== status) {
                    db.query('UPDATE websites SET status = ?, updated_time = ? WHERE id = ?', [status, now, website.id], (err) => {
                        if (err) throw err;
                        console.log(`Website ${website.url} is ${status}`);
                    });
                }
            } catch (err) {
                const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
                if (website.status !== 'FAILURE') {
                    db.query('UPDATE websites SET status = ?, updated_time = ? WHERE id = ?', ['FAILURE', now, website.id], (err) => {
                        if (err) throw err;
                        console.log(`Website ${website.url} is FAILURE`);
                    });
                }
            }
        });
    });
}, 120000);

// Create website form
app.get('/', (req, res) => {
    res.send(`
    <html>
    <head>
      <title>Website monitoring</title>
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
        width: 50%;
        box-sizing: border-box;
      }
      button[type="submit"] {
        margin-top: 30px;
        width: 10%;
        height: 40px;
      }     
      </style>
      </head>
      <body>
  <form method="POST" action="/websites">
  <input type="text" name="url" placeholder="Enter Website here to be monitored" />
  <button type="submit">Add</button>
</form>
</body>
</html>
  `);
});

// Add website to database
app.post('/websites', (req, res) => {
    const { url } = req.body;
    db.query('INSERT INTO websites (url) VALUES (?)', [url], (err) => {
        if (err) throw err;
        res.redirect('/websitesView');
    });
});


// Display websites table
app.get('/websitesView', (req, res) => {
    db.query('SELECT * FROM websites', (err, results) => {
        if (err) throw err;
        const tableRows = results.map((website) => {
            return `
          <tr>
            <td><a href="${website.url}">${website.url}</a></td>
            <td>${website.status}</td>
          </tr>
        `;
        }).join('');
        const tableHtml = `
        <html>
        <head>
          <title>Website monitoring status</title>
          <style>
          .table-container {
            text-align: center;
            outline: 1px solid #ccc;
          }
          
          table {
            font-family: Arial, sans-serif;
            border-collapse: collapse;
            width: 50%;
            margin: 0 auto;
            margin-top: 150px;
            margin-bottom: 20px;
          }
          
          table th,
          table td {
            text-align: center;
            padding: 8px;
            outline: 1px solid #000000;
          }
          
          table th {
            background-color: #343a40;
            color: #fff;
          }
          
          table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          
          table tr:hover {
            background-color: #ddd;
          }

          a {
            color: blue;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          </style>
        </head>
        <body>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        </body>
        </html>
      `;
        res.send(tableHtml);
    });
});

const port = 3002;
app.listen(port, () => {
    console.log(`Server started on ${port}`);
});