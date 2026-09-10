// Global Cart State
let cart = [];

// Toggle Cart Drawer
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Toggle Mobile Navigation Menu
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const menuIcon = document.getElementById('menu-icon');
    navMenu.classList.toggle('active');
    
    if (navMenu.classList.contains('active')) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-xmark');
    } else {
        menuIcon.classList.remove('fa-xmark');
        menuIcon.classList.add('fa-bars');
    }
}

// Add Item To Cart
function addToCart(title, price) {
    const existingIndex = cart.findIndex(item => item.title === title);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({ title: title, price: price, quantity: 1 });
    }
    
    updateCartUI();
    showToast(`${title} added to your bag!`);
}

// Update Quantity (+ / -)
function updateQuantity(title, delta) {
    const index = cart.findIndex(item => item.title === title);
    if (index > -1) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }
    updateCartUI();
}

// Render Cart UI
function updateCartUI() {
    const cartBody = document.getElementById('cart-body');
    const cartCount = document.getElementById('cart-count');
    const cartSubtotal = document.getElementById('cart-subtotal');
    
    let totalItems = 0;
    let subtotal = 0;
    cartBody.innerHTML = '';

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <i class="fa-solid fa-bag-shopping" style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.4;"></i>
                <p>Your bag is currently empty.</p>
            </div>
        `;
    } else {
        cart.forEach(item => {
            totalItems += item.quantity;
            subtotal += item.price * item.quantity;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>Rs. ${item.price * item.quantity}</p>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQuantity('${item.title}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.title}', 1)">+</button>
                </div>
            `;
            cartBody.appendChild(itemElement);
        });
    }

    cartCount.textContent = totalItems;
    cartSubtotal.textContent = `Rs. ${subtotal}`;
}

// Navbar Search Filter Functionality
function filterProductsNav(searchQuery) {
    const searchVal = searchQuery.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const desc = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchVal) || desc.includes(searchVal)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Category Tabs Filter Functionality
function filterCategory(category, buttonEl) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Toast Notification System
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Login Modal System
function openLoginModal() {
    const userPhone = prompt("Please enter your mobile number (for Login):");
    if (userPhone) {
        showToast(`Welcome! Your account (${userPhone}) has been logged in successfully.`);
    }
}

// UPDATED: Spring Boot Backend Integration + WhatsApp Checkout System
async function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert('Please add items to your bag before checking out.');
        return;
    }

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    if (!name || !phone || !address) {
        alert('Please fill out all mandatory customer fields (*).');
        return;
    }

    let itemsList = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        itemsList += `• ${item.title} (x${item.quantity}) - Rs. ${itemTotal}\n`;
    });

    // 1. Prepare JSON Payload for Java Spring Boot Backend
    const backendData = {
        customerName: name,
        phone: phone,
        address: address,
        items: cart,
        totalAmount: subtotal
    };

    // 2. Send Order Payload to Spring Boot API
    try {
        const response = await fetch('http://localhost:8080/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(backendData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Backend Response:", result);
            showToast("Order logged to Java Backend!");
        } else {
            console.warn("Backend response was not OK.");
        }
    } catch (error) {
        console.error("Backend Error (Server running?):", error);
    }

    // 3. WhatsApp Redirect Action
    const whatsappNumber = "923001234567";
    const message = `*NEW ORDER - NUSH BAKERY KARACHI*\n\n` +
                    `*Customer Details:*\n` +
                    `Name: ${name}\n` +
                    `Phone: ${phone}\n` +
                    `Address: ${address}\n\n` +
                    `*Order Summary:*\n${itemsList}\n` +
                    `*Total Amount:* Rs. ${subtotal}\n\n` +
                    `Please confirm order delivery timing.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
}