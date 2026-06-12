let products = [];
let cart = [];

// Load products from server
async function loadProducts() {
    const response = await fetch('http://localhost:3000/api/products');
    products = await response.json();
    displayProducts(products);
}

function displayProducts(productsToShow) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">GHS ${product.price}</p>
                <p class="product-stock ${product.stock === 'in' ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock === 'in' ? '✓ In Stock' : '✗ Out of Stock'}
                </p>
                <button class="add-to-cart" onclick="addToCart(${product.id})" ${product.stock === 'out' ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category || (category === 'all' && btn.textContent === 'All')) {
            btn.classList.add('active');
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
}

function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
    
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = cartTotal;
    
    const cartItemsDiv = document.getElementById('cart-items');
    if (cartItemsDiv) {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; border-bottom: 1px solid #333;">
                <span>${item.name} x${item.quantity}</span>
                <span>GHS ${item.price * item.quantity}</span>
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #f44336; cursor: pointer;">✕</button>
            </div>
        `).join('');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
        updateCartUI();
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

// Checkout form submission with Paystack integration (YOUR LIVE KEY IS HERE)
document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const location = document.getElementById('customer-location').value;
    
    if (!name || !email || !phone || !location) {
        alert('Please fill in all fields');
        return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalInPesewas = Math.round(total * 100);
    
    // Generate unique transaction reference
    const transactionRef = 'EYFEL_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    
    try {
        // Save orders to database first
        for (const item of cart) {
            await fetch('http://localhost:3000/api/orders', {
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
                    transaction_ref: transactionRef
                })
            });
        }
        
        // Initialize Paystack payment with YOUR live key
        const handler = PaystackPop.setup({
            key: 'pk_live_07d9097f29652e2b24c1270737198445238cda8b',
            email: email,
            amount: totalInPesewas,
            currency: 'GHS',
            ref: transactionRef,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Customer Name",
                        variable_name: "customer_name",
                        value: name
                    },
                    {
                        display_name: "Phone Number",
                        variable_name: "phone",
                        value: phone
                    },
                    {
                        display_name: "Delivery Location",
                        variable_name: "location",
                        value: location
                    }
                ]
            },
            callback: function(response) {
                // Payment successful
                alert(`✅ PAYMENT SUCCESSFUL!\n\nThank you ${name} for your purchase.\n\nTransaction Reference: ${response.reference}\n\nWe will contact you shortly on ${phone} for delivery.\n\n📍 Delivery Location: ${location}`);
                
                // Clear cart
                cart = [];
                updateCartUI();
                closeCheckout();
                
                // Reset form
                document.getElementById('checkout-form').reset();
            },
            onClose: function() {
                // Payment window closed
                alert('Payment cancelled. You can try again when ready.');
            }
        });
        
        handler.openIframe();
        
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error processing your order. Please try again.');
    }
});

// Load products when page loads
loadProducts();