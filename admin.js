let adminToken = false;

async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    try {
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
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
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
const productForm = document.getElementById('product-form');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('category', document.getElementById('product-category').value);
        formData.append('stock', document.getElementById('product-stock').value);
        const imageFile = document.getElementById('product-image').files[0];
        if (imageFile) formData.append('image', imageFile);
        
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('Product added successfully!');
                productForm.reset();
                loadProductsForAdmin();
            } else {
                alert('Error adding product');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add product');
        }
    });
}

async function loadProductsForAdmin() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const container = document.getElementById('products-list');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">No products yet. Add your first product!</p>';
            return;
        }
        
        function getCategoryName(cat) {
            if (cat === 'perfume') return 'Perfume';
            if (cat === 'diffuser') return 'Room Diffuser';
            if (cat === 'spray') return 'Room Spray';
            return cat;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-item" style="background: #111; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #333;">
                <div>
                    <strong style="font-size: 1.1rem;">${product.name}</strong><br>
                    <span style="color: #d4af37;">💰 GHS ${product.price}</span> | 
                    <span>📁 ${getCategoryName(product.category)}</span> | 
                    <span>📦 Stock: ${product.stock === 'in' ? '✓ In Stock' : '✗ Out of Stock'}</span>
                </div>
                <div class="action-buttons">
                    <button class="btn-in-stock" onclick="updateStock(${product.id}, 'in')">✓ In Stock</button>
                    <button class="btn-out-stock" onclick="updateStock(${product.id}, 'out')">✗ Out of Stock</button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.name}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function updateStock(productId, status) {
    try {
        const response = await fetch('/api/update-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productId, stock: status })
        });
        
        if (response.ok) {
            alert(`Stock updated to ${status === 'in' ? 'In Stock' : 'Out of Stock'}`);
            loadProductsForAdmin();
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock');
    }
}

async function deleteProduct(productId, productName) {
    const confirmDelete = confirm(`⚠️ Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone!`);
    
    if (!confirmDelete) return;
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ "${productName}" has been deleted successfully!`);
            loadProductsForAdmin();
        } else {
            alert('Error deleting product. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">No orders yet</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-item" style="background: #111; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #333;">
                <div class="order-details">
                    <p><strong>${order.customer_name}</strong> - 📞 ${order.phone}</p>
                    <p>📧 ${order.email || 'No email'}</p>
                    <p>📍 Location: ${order.location}</p>
                    <p>🛍️ Product: ${order.product_name} x${order.quantity}</p>
                    <p>💰 Total: GHS ${order.total}</p>
                    <p>📅 Date: ${new Date(order.date).toLocaleString()}</p>
                    ${order.transaction_ref ? `<p>🔑 Ref: ${order.transaction_ref}</p>` : ''}
                </div>
                <div class="order-status" style="display: inline-block; padding: 5px 10px; background: #4caf50; color: white; border-radius: 5px;">${order.status || 'Pending'}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}