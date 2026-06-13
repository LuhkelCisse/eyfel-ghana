// Simple product loader for EYFEL GHANA
let products = [];
let cart = [];

// Load products when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, fetching products...');
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        console.log('Products received:', data);
        products = data;
        showProducts(products);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('products-grid').innerHTML = '<p style="text-align:center;color:#d4af37;">Unable to load products. Please refresh the page.</p>';
    }
}

function showProducts(productList) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (!productList || productList.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#888;">No products available. Check back soon!</p>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < productList.length; i++) {
        const p = productList[i];
        html += `
            <div class="product-card">
                <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-price">GHS ${p.price}</p>
                    <p class="product-stock ${p.stock === 'in' ? 'in-stock' : 'out-of-stock'}">
                        ${p.stock === 'in' ? '✓ In Stock' : '✗ Out of Stock'}
                    </p>
                    <button class="add-to-cart" onclick="addToCart(${p.id})" ${p.stock === 'out' ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function filterProducts(category) {
    if (category === 'all') {
        showProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        showProducts(filtered);
    }
    
    // Update active button
    const btns = document.querySelectorAll('.filter-btn');
    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (btns[i].textContent === 'All' && category === 'all') {
            btns[i].classList.add('active');
        } else if (btns[i].textContent.toLowerCase() === category) {
            btns[i].classList.add('active');
        }
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartDisplay();
    alert(product.name + ' added to cart!');
}

function updateCartDisplay() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = count;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = total;
    
    const itemsDiv = document.getElementById('cart-items');
    if (itemsDiv) {
        if (cart.length === 0) {
            itemsDiv.innerHTML = '<p style="text-align:center;color:#888;">Your cart is empty</p>';
        } else {
            let html = '';
            for (let i = 0; i < cart.length; i++) {
                const item = cart[i];
                html += `
                    <div style="display:flex;justify-content:space-between;margin:10px 0;padding:10px;border-bottom:1px solid #333;">
                        <span>${item.name} x${item.quantity}</span>
                        <span>GHS ${item.price * item.quantity}</span>
                        <button onclick="removeFromCart(${item.id})" style="background:none;border:none;color:#f44336;cursor:pointer;">✕</button>
                    </div>
                `;
            }
            itemsDiv.innerHTML = html;
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
        updateCartDisplay();
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    document.getElementById('cart-modal').style.display = 'none';
    document.getElementById('checkout-modal').style.display = 'block';
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// Checkout form
const form = document.getElementById('checkout-form');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;
        const location = document.getElementById('customer-location').value;
        
        if (!name || !email || !phone || !location) {
            alert('Please fill in all fields');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const ref = 'EYFEL_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        
        try {
            for (const item of cart) {
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: name,
                        phone: phone,
                        location: location,
                        email: email,
                        product_name: item.name,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                        transaction_ref: ref
                    })
                });
            }
            
            const handler = PaystackPop.setup({
                key: 'pk_live_07d9097f29652e2b24c1270737198445238cda8b',
                email: email,
                amount: Math.round(total * 100),
                currency: 'GHS',
                ref: ref,
                callback: function() {
                    alert('Payment successful! We will contact you shortly.');
                    cart = [];
                    updateCartDisplay();
                    closeCheckout();
                    form.reset();
                },
                onClose: function() {
                    alert('Payment cancelled.');
                }
            });
            handler.openIframe();
        } catch (error) {
            alert('Error processing order. Please try again.');
        }
    });
}