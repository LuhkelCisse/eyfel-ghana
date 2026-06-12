let adminToken = false;

async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
        adminToken = true;
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadProductsForAdmin();
        loadOrders();
    } else {
        alert('Invalid credentials! Use admin/admin123');
    }
}

function logout() {
    adminToken = false;
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (tabName === 'manage-stock') loadProductsForAdmin();
    if (tabName === 'orders') loadOrders();
}

// Add Product
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('stock', document.getElementById('product-stock').value);
    formData.append('image', document.getElementById('product-image').files[0]);
    
    const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData
    });
    
    if (response.ok) {
        alert('Product added successfully!');
        document.getElementById('product-form').reset();
        loadProductsForAdmin();
    }
});

async function loadProductsForAdmin() {
    const response = await fetch('http://localhost:3000/api/products');
    const products = await response.json();
    
    const container = document.getElementById('products-list');
    container.innerHTML = products.map(product => `
        <div class="product-item">
            <div>
                <strong>${product.name}</strong><br>
                Price: GHS ${product.price} | Stock: ${product.stock === 'in' ? '✓ In Stock' : '✗ Out of Stock'}
            </div>
            <div>
                <button class="stock-btn" onclick="updateStock(${product.id}, 'in')">Mark In Stock</button>
                <button class="stock-btn" onclick="updateStock(${product.id}, 'out')">Mark Out of Stock</button>
            </div>
        </div>
    `).join('');
}

async function updateStock(productId, status) {
    const response = await fetch('http://localhost:3000/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock: status })
    });
    
    if (response.ok) {
        alert(`Stock updated to ${status === 'in' ? 'In Stock' : 'Out of Stock'}`);
        loadProductsForAdmin();
    }
}

async function loadOrders() {
    const response = await fetch('http://localhost:3000/api/orders');
    const orders = await response.json();
    
    const container = document.getElementById('orders-list');
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-details">
                <p><strong>${order.customer_name}</strong> - 📞 ${order.phone}</p>
                <p>📍 Location: ${order.location}</p>
                <p>🛍️ Product: ${order.product_name} x${order.quantity}</p>
                <p>💰 Total: GHS ${order.total}</p>
                <p>📅 Date: ${new Date(order.date).toLocaleString()}</p>
            </div>
            <div class="order-status">${order.status || 'Pending'}</div>
        </div>
    `).join('');
}

// Create uploads folder dynamically
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}