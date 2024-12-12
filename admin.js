// Fonction pour activer le mode édition pour un produit
function enableProductEditing(productId) {
    const productInfo = document.querySelector(`#product-${productId} .product-info`);
    const editButton = document.querySelector(`#product-${productId} .edit-button`);
    const saveButton = document.querySelector(`#product-${productId} .save-button`);

    // Récupérer les éléments existants
    const name = productInfo.querySelector(`#product-name-${productId}`);
    const category = productInfo.querySelector(`#product-category-${productId}`);
    const price = productInfo.querySelector(`#product-price-${productId}`);
    const description = productInfo.querySelector(`#product-description-${productId}`);
    const imageInput = document.querySelector(`#image-input-${productId}`);

    // Rendre modifiables les champs
    name.insertAdjacentHTML('afterend', `<input type="text" id="input-name-${productId}" value="${name.textContent}">`);
    category.insertAdjacentHTML('afterend', `
        <select id="input-category-${productId}">
            <option value="1" ${category.textContent.includes('1') ? 'selected' : ''}>1</option>
            <option value="2" ${category.textContent.includes('2') ? 'selected' : ''}>2</option>
            <option value="3" ${category.textContent.includes('3') ? 'selected' : ''}>3</option>
        </select>
    `);
    price.insertAdjacentHTML('afterend', `<input type="number" id="input-price-${productId}" value="${price.textContent.replace('Prix : €', '')}">`);
    description.insertAdjacentHTML('afterend', `<textarea id="input-description-${productId}">${description.textContent}</textarea>`);

    // Afficher le champ de téléchargement d'image
    imageInput.style.display = 'block';

    // Masquer les champs existants
    name.style.display = 'none';
    category.style.display = 'none';
    price.style.display = 'none';
    description.style.display = 'none';

    // Afficher "Enregistrer" et masquer "Modifier"
    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';
}

// Fonction pour sauvegarder les modifications d'un produit
function saveProductChanges(productId) {
    const productInfo = document.querySelector(`#product-${productId} .product-info`);
    const editButton = document.querySelector(`#product-${productId} .edit-button`);
    const saveButton = document.querySelector(`#product-${productId} .save-button`);

    // Récupérer les nouvelles valeurs
    const newName = document.querySelector(`#input-name-${productId}`).value;
    const newCategory = document.querySelector(`#input-category-${productId}`).value;
    const newPrice = document.querySelector(`#input-price-${productId}`).value;
    const newDescription = document.querySelector(`#input-description-${productId}`).value;
    const imageInput = document.querySelector(`#image-input-${productId}`);
    const productImage = document.querySelector(`#product-image-${productId}`);

    // Si une nouvelle image est téléchargée, mettre à jour l'aperçu
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            productImage.src = e.target.result;
        };
        reader.readAsDataURL(imageInput.files[0]);
    }

    // Mettre à jour les textes avec les nouvelles valeurs
    productInfo.querySelector(`#product-name-${productId}`).textContent = newName;
    productInfo.querySelector(`#product-category-${productId}`).textContent = `Catégorie : ${newCategory}`;
    productInfo.querySelector(`#product-price-${productId}`).textContent = `Prix : €${newPrice}`;
    productInfo.querySelector(`#product-description-${productId}`).textContent = newDescription;

    // Supprimer les champs modifiables
    document.querySelector(`#input-name-${productId}`).remove();
    document.querySelector(`#input-category-${productId}`).remove();
    document.querySelector(`#input-price-${productId}`).remove();
    document.querySelector(`#input-description-${productId}`).remove();

    // Réafficher les champs
    productInfo.querySelector(`#product-name-${productId}`).style.display = 'block';
    productInfo.querySelector(`#product-category-${productId}`).style.display = 'block';
    productInfo.querySelector(`#product-price-${productId}`).style.display = 'block';
    productInfo.querySelector(`#product-description-${productId}`).style.display = 'block';

    // Cacher le champ de téléchargement d'image
    imageInput.style.display = 'none';

    // Afficher "Modifier" et masquer "Enregistrer"
    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';

    console.log('Produit mis à jour :', { newName, newCategory, newPrice, newDescription });
}

// Fonction pour supprimer un produit
function deleteProduct(productId) {
    const productItem = document.getElementById(`product-${productId}`);
    productItem.remove();

    console.log(`Produit ${productId} supprimé`);
}

// Fonction pour activer le mode édition pour un client
function enableClientEditing(clientId) {
    const clientInfo = document.querySelector(`#client-${clientId} .client-info`);
    const editButton = document.querySelector(`#client-${clientId} .edit-button`);
    const saveButton = document.querySelector(`#client-${clientId} .save-button`);

    // Récupérer les éléments existants
    const username = clientInfo.querySelector(`#client-username-${clientId}`);
    const orders = clientInfo.querySelector(`#client-orders-${clientId}`);
    const email = clientInfo.querySelector(`#client-email-${clientId}`);
    const role = clientInfo.querySelector(`#client-role-${clientId}`);

    // Rendre modifiables les champs
    username.insertAdjacentHTML('afterend', `<input type="text" id="input-username-${clientId}" value="${username.textContent.replace('Nom d\\'utilisateur : ', '')}">`);
    orders.insertAdjacentHTML('afterend', `<input type="number" id="input-orders-${clientId}" value="${orders.textContent.replace('Commandes passées : ', '')}">`);
    email.insertAdjacentHTML('afterend', `<input type="email" id="input-email-${clientId}" value="${email.textContent.replace('Email : ', '')}">`);
    role.insertAdjacentHTML('afterend', `
        <select id="input-role-${clientId}">
            <option value="Utilisateur" ${role.textContent.includes('Utilisateur') ? 'selected' : ''}>Utilisateur</option>
            <option value="Admin" ${role.textContent.includes('Admin') ? 'selected' : ''}>Admin</option>
        </select>
    `);

    // Masquer les textes existants
    username.style.display = 'none';
    orders.style.display = 'none';
    email.style.display = 'none';
    role.style.display = 'none';

    // Afficher "Enregistrer" et masquer "Modifier"
    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';
}

// Fonction pour sauvegarder les modifications d'un client
function saveClientChanges(clientId) {
    const clientInfo = document.querySelector(`#client-${clientId} .client-info`);
    const editButton = document.querySelector(`#client-${clientId} .edit-button`);
    const saveButton = document.querySelector(`#client-${clientId} .save-button`);

    // Récupérer les nouvelles valeurs
    const newUsername = document.querySelector(`#input-username-${clientId}`).value;
    const newOrders = document.querySelector(`#input-orders-${clientId}`).value;
    const newEmail = document.querySelector(`#input-email-${clientId}`).value;
    const newRole = document.querySelector(`#input-role-${clientId}`).value;

    // Mettre à jour les textes avec les nouvelles valeurs
    clientInfo.querySelector(`#client-username-${clientId}`).textContent = `Nom d'utilisateur : ${newUsername}`;
    clientInfo.querySelector(`#client-orders-${clientId}`).textContent = `Commandes passées : ${newOrders}`;
    clientInfo.querySelector(`#client-email-${clientId}`).textContent = `Email : ${newEmail}`;
    clientInfo.querySelector(`#client-role-${clientId}`).textContent = `Rôle : ${newRole}`;

    // Supprimer les champs modifiables
    document.querySelector(`#input-username-${clientId}`).remove();
    document.querySelector(`#input-orders-${clientId}`).remove();
    document.querySelector(`#input-email-${clientId}`).remove();
    document.querySelector(`#input-role-${clientId}`).remove();

    // Réafficher les champs
    clientInfo.querySelector(`#client-username-${clientId}`).style.display = 'block';
    clientInfo.querySelector(`#client-orders-${clientId}`).style.display = 'block';
    clientInfo.querySelector(`#client-email-${clientId}`).style.display = 'block';
    clientInfo.querySelector(`#client-role-${clientId}`).style.display = 'block';

    // Afficher "Modifier" et masquer "Enregistrer"
    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';

    console.log('Client mis à jour :', { newUsername, newOrders, newEmail, newRole });
}

// Fonction pour supprimer un client
function deleteClient(clientId) {
    const clientItem = document.getElementById(`client-${clientId}`);
    clientItem.remove();

    console.log(`Client ${clientId} supprimé`);
}
