const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbFile = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
    }
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: 'Имя пользователя и пароль обязательны' });
    }

    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(query, [username, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.json({ success: false, message: 'Пользователь уже существует' });
            }
            return res.json({ success: false, message: 'Ошибка сервера' });
        }
        res.json({ success: { success: true, message: 'Регистрация успешна!' } });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: 'Заполните все поля' });
    }

    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.json({ success: false, message: 'Ошибка сервера' });
        }
        if (row) {
            res.json({ success: true, message: 'Успешный вход!', username: row.username });
        } else {
            res.json({ success: false, message: 'Неверное имя пользователя или пароль' });
        }
    });
});

// Protect index.html route explicitly on server or fallback
app.get('/index.html', (req, res) => {
    // We can serve index.html, but protection is handled by client sessionStorage or token check
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
