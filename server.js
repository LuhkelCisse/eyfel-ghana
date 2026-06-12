const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Simple JSON file-based database (works everywhere!)
const DATA_FILE = process.env.NODE_ENV === 'production' ? '/tmp/data.json' : 'data.json';

// Initialize data file
let db = {
    products: [],
    orders: [],
    admin: [{ username: 'admin', password: 'admin123' }],
    nextProductId: 7,
    nextOrderId: 1
};

// Load existing data if file exists
if (fs.existsSync(DATA_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db = { ...db, ...savedData };
    } catch (e) {
        console.log('Creating new database file');
    }
}

// Save data function
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Add sample products if none exist
if (db.products.length === 0) {
    db.products = [
        { id: 1, name: 'Royal Oud Perfume', price: 350, category: 'perfume', stock: 'in', image: 'https://images.unsplash.com/photo-1594035910388-3443d2d6f691?w=300' },
        { id: 2, name: 'Black Orchid Diffuser', price: 250, category: 'diffuser', stock: 'in', image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300' },
        { id: 3, name: 'Golden Amber Perfume', price: 420, category: 'perfume', stock: 'in', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300' },
        { id: 4, name: 'Vanilla Bliss Diffuser', price: 180, category: 'diffuser', stock: 'in', image: 'https://images.unsplash.com/photo-1602874801007-bd36f3c95a4a?w=300' },
        { id: 5, name: 'Sandalwood Supreme', price: 380, category: 'perfume', stock: 'in', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300' },
        { id: 6, name: 'Lavender Dreams Diffuser', price: 220, category: 'diffuser', stock: 'in', image: 'https://images.unsplash.com/photo-1602524811126-ea2470f4104b?w=300' }
    ];
    db.nextProductId = 7;
    saveData();
}

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
    
    const newProduct = {
        id: db.nextProductId++,
        name,
        price: parseFloat(price),
        category,
        stock,
        image
    };
    
    db.products.push(newProduct);
    saveData();
    res.json({ id: newProduct.id, success: true });
});

app.get('/api/products', (req, res) => {
    res.json(db.products);
});

app.post('/api/orders', (req, res) => {
    const { customer_name, phone, location, email, product_name, quantity, total, transaction_ref } = req.body;
    const date = new Date().toISOString();
    
    const newOrder = {
        id: db.nextOrderId++,
        customer_name,
        phone,
        location,
        email,
        product_name,
        quantity: parseInt(quantity),
        total: parseFloat(total),
        status: 'pending',
        transaction_ref: transaction_ref || null,
        date
    };
    
    db.orders.push(newOrder);
    saveData();
    res.json({ id: newOrder.id, success: true });
});

app.get('/api/orders', (req, res) => {
    const orders = [...db.orders].reverse(); // Newest first
    res.json(orders);
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.admin.find(a => a.username === username && a.password === password);
    res.json({ success: !!admin });
});

app.post('/api/update-stock', (req, res) => {
    const { id, stock } = req.body;
    const product = db.products.find(p => p.id === id);
    if (product) {
        product.stock = stock;
        saveData();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Product not found' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Website live!`);
});