// EYFEL GHANA - Main Shop Script
let products = [];
let cart = [];

// Load products when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, fetching products...');
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        console.log('Products loaded:', products.length);
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = '<p style="text-align: center; color: red;">Error loading products. Please refresh the page.</p>';
        }
    }
}

function displayProducts(productsToShow) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #888;">No products available. Check back soon!</p>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category" style="color: #d4af37; font-size: 0.8rem; margin: 5px 0;">
                    ${getCategoryName(product.category)}
                </p>
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

function getCategoryName(category) {
    switch(category) {
        case 'perfume': return '✨ Perfume';
        case 'diffuser': return '🏠 Room Diffuser';
        case 'spray': return '💨 Room Spray';
        default: return '📦 Product';
    }
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
        if (btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'All')) {
            btn.classList.add('active');
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    showNotification(`${product.name} added to cart!`);
}

function showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#d4af37';
    notification.style.color = '#000';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.fontWeight = 'bold';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) cartCountElement.textContent = cartCount;
    
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) cartTotalElement.textContent = cartTotal;
    
    const cartItemsDiv = document.getElementById('cart-items');
    if (cartItemsDiv) {
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align: center; color: #888;">Your cart is empty</p>';
        } else {
            cartItemsDiv.innerHTML = cart.map(item => `
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; border-bottom: 1px solid #333;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color: #d4af37;">${getCategoryName(item.category)}</small>
                        <div>x${item.quantity}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>GHS ${item.price * item.quantity}</div>
                        <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #f44336; cursor: pointer; margin-top: 5px;">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'block';
            updateCartUI();
        }
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const cartModal = document.getElementById('cart-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    if (cartModal) cartModal.style.display = 'none';
    if (checkoutModal) checkoutModal.style.display = 'block';
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.style.display = 'none';
}

// Checkout form submission with Paystack integration
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
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
            // Save orders to database
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
                        transaction_ref: transactionRef
                    })
                });
            }
            
            // Initialize Paystack payment
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
                    alert(`✅ PAYMENT SUCCESSFUL!\n\nThank you ${name} for your purchase.\n\nTransaction Reference: ${response.reference}\n\nWe will contact you shortly on ${phone} for delivery.\n\n📍 Delivery Location: ${location}`);
                    
                    // Clear cart
                    cart = [];
                    updateCartUI();
                    closeCheckout();
                    
                    // Reset form
                    checkoutForm.reset();
                },
                onClose: function() {
                    alert('Payment cancelled. You can try again when ready.');
                }
            });
            
            handler.openIframe();
            
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error processing your order. Please try again.');
        }
    });
}