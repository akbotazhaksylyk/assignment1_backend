const express = require('express'); // import the express framework for creating a web server
const bcrypt = require("bcrypt"); // import the bcrypt library for password hashing
const path = require('path'); //for working with file and directory paths

const { Pool } = require("pg");

const pool = new Pool({
    host: `localhost`,
    user: `postgres`,
    port: 5432,
    database: `users`,
    password: `0000`
});

pool.connect();

const app = express()

const port = 8080

//password hashing
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// to enable the parsing of the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/static/html/login.html'));
})

app.get("/regist", (req, res) => {
    res.sendFile(path.join(__dirname, '/static/html/regist.html'));
})

app.get("/success", (req, res) => {
    res.sendFile(path.join(__dirname, '/static/html/success.html'));
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM public.users_table WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            // Iterate through each row and check the password
            for (const row of result.rows) {
                const hashedPassword = row.password;

                if (await comparePasswords(password, hashedPassword)) {
                    console.log('Login successful!');
                    res.redirect('/success');
                    return; // Exit the loop if login is successful
                }
            }
            
            // If the loop completes and no matching password is found
            console.log('Invalid password');
            res.send('Invalid username or password');
        } else {
            console.log('User not found');
            res.send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error executing login query', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/register', async (req, res) => {
    const { username, password, age } = req.body;
    try {
        const hashedPassword = await hashPassword(password); // Hash the entered password

        const result = await pool.query('INSERT INTO public.users_table (username, password, age) VALUES ($1, $2, $3) RETURNING *', [username, hashedPassword, age]);
        
        res.send(`Registration successful. User details: ${JSON.stringify(result.rows[0])}`);
    } catch (error) {
        console.error('Error executing registration query', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});