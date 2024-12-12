// Variables globales
const productList = document.getElementById("productList");
const productForm = document.getElementById("productForm");
const modifyProductForm = document.getElementById("modifyProductForm");
const editProductButton = document.getElementById("editProduct");
let selectedProduct = null;

// Activer le mode modification
editProductButton.addEventListener("click", () => {
    alert("Mode modification activé : cliquez sur un produit à modifier.");
    productList.addEventListener("click", (e) => {
        const productCard = e.target.closest(".product-card");
        if (!productCard) return;

        // Surbrillance orange
        document.querySelectorAll(".product-card").forEach(card => card.classList.remove("selected"));
        productCard.classList.add("selected");

        // Charger les données dans le formulaire
        selectedProduct = {
            id: productCard.dataset.id,
            title: productCard.querySelector("h3").textContent,
            price: productCard.querySelector("p:nth-child(3)").textContent.split(": ")[1].replace("€", ""),
            category: productCard.querySelector("p:nth-child(2)").textContent.split(": ")[1],
        };

        document.getElementById("productTitle").value = selectedProduct.title;
        document.getElementById("productPrice").value = selectedProduct.price;
        document.getElementById("productCategory").value = selectedProduct.category;

        // Afficher le formulaire
        productForm.style.display = "block";
    });
});

// Modifier un produit
modifyProductForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Appliquer les modifications
    const newTitle = document.getElementById("productTitle").value;
    const newPrice = document.getElementById("productPrice").value;
    const newCategory = document.getElementById("productCategory").value;

    const selectedCard = document.querySelector(`.product-card[data-id="${selectedProduct.id}"]`);
    selectedCard.querySelector("h3").textContent = newTitle;
    selectedCard.querySelector("p:nth-child(3)").textContent = `Prix: ${newPrice}€`;
    selectedCard.querySelector("p:nth-child(2)").textContent = `Catégorie: ${newCategory}`;

    // Réinitialiser
    productForm.style.display = "none";
    selectedCard.classList.remove("selected");
});
