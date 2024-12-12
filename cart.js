// Variables pour le panier et le prix total
let cart = [];
let totalPrice = 0;

// Fonction pour ajouter un article au panier
function addToCart(name, price) {
    cart.push({ name, price });
    totalPrice += price;
    updateCartDisplay();
}

// Fonction pour mettre à jour l'affichage du panier
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = ""; // Réinitialise le contenu

    // Affiche chaque article du panier
    cart.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `${item.name} - €${item.price} <button onclick="removeFromCart(${index})">Supprimer</button>`;
        cartItemsContainer.appendChild(cartItem);
    });

    // Met à jour le prix total
    document.getElementById("total-price").innerText = `Total: €${totalPrice}`;
}

// Fonction pour supprimer un article du panier
function removeFromCart(index) {
    totalPrice -= cart[index].price;
    cart.splice(index, 1);
    updateCartDisplay();
}

// Fonction pour vider le panier
function clearCart() {
    cart = [];
    totalPrice = 0;
    updateCartDisplay();
}
