let adminToken = false;

async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    // Use relative URL - works on any domain
    const response = await fetch('/api/admin/login', {
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
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) formData.append('image', imageFile);
    
    const response = await fetch('/api/products', {
        method: 'POST',
        body: formData
    });
    
    if (response.ok) {
        alert('Product added successfully!');
        document.getElementById('product-form').reset();
        loadProductsForAdmin();
    } else {
        alert('Error adding product');
    }
});

async function loadProductsForAdmin() {
    const response = await fetch('/api/products');
    const products = await response.json();
    
    const container = document.getElementById('products-list');
    if (!container) return;
    
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
    const response = await fetch('/api/update-stock', {
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
    const response = await fetch('/api/orders');
    const orders = await response.json();
    
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No orders yet</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-details">
                <p><strong>${order.customer_name}</strong> - 📞 ${order.phone}</p>
                <p>📧 ${order.email || 'No email'}</p>
                <p>📍 Location: ${order.location}</p>
                <p>🛍️ Product: ${order.product_name} x${order.quantity}</p>
                <p>💰 Total: GHS ${order.total}</p>
                <p>📅 Date: ${new Date(order.date).toLocaleString()}</p>
                ${order.transaction_ref ? `<p>🔑 Ref: ${order.transaction_ref}</p>` : ''}
            </div>
            <div class="order-status">${order.status || 'Pending'}</div>
        </div>
    `).join('');
}