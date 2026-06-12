const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Create uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Database setup
const db = new sqlite3.Database('eyfel.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        stock TEXT,
        image TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        phone TEXT,
        location TEXT,
        product_name TEXT,
        quantity INTEGER,
        total REAL,
        status TEXT,
        date TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin (
        username TEXT,
        password TEXT
    )`);

    // Insert default admin (username: admin, password: admin123)
    db.run(`INSERT OR IGNORE INTO admin (username, password) VALUES ('admin', 'admin123')`);
    
    // Add some sample products
    db.run(`INSERT OR IGNORE INTO products (id, name, price, category, stock, image) VALUES 
        (1, 'Royal Oud Perfume', 350, 'perfume', 'in', 'https://images.unsplash.com/photo-1594035910388-3443d2d6f691?w=300'),
        (2, 'Black Orchid Diffuser', 250, 'diffuser', 'in', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300'),
        (3, 'Golden Amber Perfume', 420, 'perfume', 'in', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300'),
        (4, 'Vanilla Bliss Diffuser', 180, 'diffuser', 'in', 'https://images.unsplash.com/photo-1602874801007-bd36f3c95a4a?w=300')
    `);
});

// Image upload setup
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API Routes
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, category, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(`INSERT INTO products (name, price, category, stock, image) VALUES (?, ?, ?, ?, ?)`,
        [name, price, category, stock, image], function(err) {
            if (err) res.json({ error: err.message });
            else res.json({ id: this.lastID, success: true });
        });
});

app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, (err, rows) => {
        if (err) res.json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { customer_name, phone, location, product_name, quantity, total } = req.body;
    const date = new Date().toISOString();
    db.run(`INSERT INTO orders (customer_name, phone, location, product_name, quantity, total, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_name, phone, location, product_name, quantity, total, 'pending', date], function(err) {
            if (err) res.json({ error: err.message });
            else res.json({ id: this.lastID, success: true });
        });
});

app.get('/api/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY date DESC`, (err, rows) => {
        if (err) res.json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM admin WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (row) res.json({ success: true });
        else res.json({ success: false });
    });
});

app.post('/api/update-stock', (req, res) => {
    const { id, stock } = req.body;
    db.run(`UPDATE products SET stock = ? WHERE id = ?`, [stock, id], (err) => {
        if (err) res.json({ error: err.message });
        else res.json({ success: true });
    });
});

app.listen(3000, () => {
    console.log('✅ Server running on http://localhost:3000');
    console.log('📱 Main website: http://localhost:3000');
    console.log('👑 Admin panel: http://localhost:3000/admin.html');
    console.log('🔑 Admin login: username: admin | password: admin123');
});