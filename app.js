require('dotenv').config(); // pour charger les informations de info.env
const express = require('express'); // créer et gérer le serveur web
const mysql = require('mysql'); // Se connecter à la DB
const cors = require('cors'); // gérer  API
const path = require('path'); // pour def le chemin
const router = express.Router();


require('dotenv').config({ path: './info.env' }); // pour eviter les problèmes de chemins

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static('images')); // middleware pour servir le doc images

//app.use('/images', express.static(path.join(__dirname, 'public/images'))); // debug


// connexion à la base de données dbtechnoback - verifiez le info.env 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Erreur de connexion à la database :", err);
        return;
    }
    console.log('Connexion réussie à la DB de MySQL');
});

// test serveur
app.get('/', (req, res) => {
    res.send('Le serveur node.js est fonctionnel');
});

function checkAdminRole(req, res, next) { // middleware pour vérifier si l'utilisateur est admin
    const { role } = req.body; // A fair epour secu : le rôle devrait être passé depuis le front-end ou vérifié via JWT
    if (role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Droits insuffisants." });
    }
    next();
}

const bcrypt = require('bcrypt'); // pour la hashage des données


// Routes 

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Les champs nom d'utilisateur, email, et mot de passe sont requis." });
    }

    try {
        // hachage du mdp
        const saltRounds = 10; // nombre de rounds de salage (sécurité)
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log("Mot de passe original :", password);
        console.log("Mot de passe haché :", hashedPassword);


        const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        const userRole = role || 'user';

        db.query(query, [username, email, hashedPassword, userRole], (err, result) => {
            if (err) {
                console.error("Erreur lors de l'ajout de l'utilisateur :", err);
                return res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur" });
            }
            res.status(201).json({ message: 'Utilisateur créé avec succès', role: userRole });
        });
    } catch (error) {
        console.error("Erreur lors du hachage du mot de passe :", error);
        res.status(500).json({ message: "Erreur interne lors de la création de l'utilisateur." });
    }
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error("Erreur lors de la connexion :", err);
            return res.status(500).json({ message: 'Erreur lors de la connexion' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
        }

        // Envoie l'ID utilisateur et autres informations nécessaires
        res.json({
            message: 'Connexion réussie!',
            userId: user.id,  // Ajout de l'userId dans la réponse
            role: user.role,   // Retourner le rôle de l'utilisateur si nécessaire
        });
    });
});


// route DELETE pour supprimer un utilisateur (admin uniquement)
app.delete('/delete-user/:id', checkAdminRole, (req, res) => {
    const userId = req.params.id;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression de l'utilisateur :", err);
            return res.status(500).json({ message: "Erreur serveur." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        res.json({ message: "Utilisateur supprimé avec succès." });
    });
});

// Ajout d'un produit
app.post('/api/products', (req, res) => {
    const { name, price, description, image_url, category } = req.body;

    if (!image_url || !name || !price || !description || !category) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const query = 'INSERT INTO products (name, price, description, image_url, category) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, price, description, image_url, category], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du produit :', err);
            return res.status(500).json({ message: 'Erreur lors de l\'ajout du produit' });
        }
        res.status(200).json({ message: 'Produit ajouté avec succès' });
    });
});


// Route pour récupérer tous les produits
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération des produits:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
        }
        res.status(200).json(result);  
    });
});




// Route pour supprimer un produit
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;

    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression du produit :', err);
            return res.status(500).json({ message: 'Erreur lors de la suppression du produit' });
        }
        res.status(200).json({ message: 'Produit supprimé avec succès' });
    });
});

// Route pour récupérer un produit spécifique par son ID
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;

    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération du produit :', err);
            return res.status(500).json({ message: 'Erreur serveur lors de la récupération du produit' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        res.status(200).json(result[0]);  
    });
});


// // recup les articles par catégorie (admin vers shop)
// app.get('/api/products/category/:categoryId', (req, res) => {
//     const categoryId = req.params.categoryId;  // Récupère l'ID de la catégorie depuis l'URL
//     console.log('ID de la catégorie demandé :', categoryId);

//     // Requête SQL pour récupérer les produits ayant la catégorie spécifiée
//     db.query('SELECT * FROM products WHERE category = ?', [categoryId], (err, results) => {
//         if (err) {
//             console.error('Erreur SQL:', err.message);
//             return res.status(500).json({ error: err.message });
//         }

//         if (results.length === 0) {
//             return res.status(404).json({ message: 'Aucun produit trouvé pour cette catégorie' });
//         }

//         res.json(results);  // Retourne les produits trouvés
//     });
// });

// recupérer les infos des produits par catégorie pour les afficher dans la bonne page

app.get('/api/products/category/:categoryId', (req, res) => {
    const categoryId = req.params.categoryId;
    db.query('SELECT * FROM products WHERE category = ?', [categoryId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});



app.put('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const { name, price, description, image_url, category } = req.body;

    if (!name || !price || !description || !image_url || !category) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const query = 'UPDATE products SET name = ?, price = ?, description = ?, image_url = ?, category = ? WHERE id = ?';
    db.query(query, [name, price, description, image_url, category, productId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du produit :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        res.status(200).json({ message: 'Produit mis à jour avec succès' });
    });
});


// Route pour récupérer tous les utilisateurs
app.get('/api/users', (req, res) => {
    const query = 'SELECT id, username, email, role FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs :', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
        }
        res.status(200).json(results);
    });
});

// Route pour récupérer un utilisateur par ID
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT id, username, email, role FROM users WHERE id = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'utilisateur :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json(results[0]);
    });
});

// Route pour mettre à jour un utilisateur
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
        return res.status(400).json({ message: 'Tous les champs (nom d\'utilisateur, email, rôle) sont requis.' });
    }

    const query = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
    db.query(query, [username, email, role, userId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });
    });
});

// Route pour supprimer un utilisateur
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'utilisateur :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    });
});

// Route pour ajouter un utilisateur
app.post('/api/users', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs (nom d\'utilisateur, email, mot de passe, rôle) sont requis.' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, hashedPassword, role], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de l\'utilisateur :', err);
                return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'utilisateur' });
            }
            res.status(201).json({ message: 'Utilisateur ajouté avec succès.' });
        });
    } catch (error) {
        console.error('Erreur lors du hachage du mot de passe :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// // Route pour enregistrer une commande

app.post('/create-order', (req, res) => {
    const { userId, cart, totalPrice } = req.body;
    console.log("Données reçues dans /create-order :", req.body);

    // Vérifier si l'userId et le panier sont présents
    if (!userId || !cart || cart.length === 0) {
        return res.status(400).json({ error: 'User ID or cart is missing.' });
    }

    // Insérer la commande dans la base de données, par exemple
    const query = 'INSERT INTO orders (user_id, total_price, cart_items) VALUES (?, ?, ?)';
    const cartJson = JSON.stringify(cart);  // Convertir le panier en JSON pour l'enregistrer

    db.query(query, [userId, totalPrice, cartJson], (err, results) => {
        if (err) {
            console.error('Erreur lors de la création de la commande :', err);
            return res.status(500).json({ error: 'Erreur lors de la création de la commande.' });
        }

        // Répondre avec succès si la commande a été créée
        res.json({ message: 'Commande créée avec succès!', orderId: results.insertId });
    });
});

// app.post('/orders', async (req, res) => {
//     const { userId, cart, totalPrice } = req.body;

//     if (!userId || !cart || cart.length === 0 || !totalPrice) {
//         return res.status(400).json({ message: 'Données manquantes ou invalides.' });
//     }

//     try {
//         // Vérifier si l'utilisateur existe
//         const userCheck = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//         if (userCheck.length === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }

//         // Insérer la commande dans la table "orders"
//         const result = await db.query('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', [userId, totalPrice]);
//         const orderId = result.insertId;

//         // Insérer les articles dans la table "order_items"
//         for (const item of cart) {
//             await db.query(
//                 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
//                 [orderId, item.productId, item.quantity, item.price]
//             );
//         }

//         res.status(201).json({ message: 'Commande enregistrée avec succès.' });
//     } catch (error) {
//         console.error('Erreur lors de l\'insertion de la commande :', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement de la commande.' });
//     }
// });



// app.post('/submit-order', async (req, res) => {
//     const { userId, cart } = req.body; // userId: ID du client, cart: produits dans le panier
//     console.log('Données reçues:', { userId, cart }); // Log des données reçues

//     if (!userId || !cart || cart.length === 0) {
//         return res.status(400).json({ message: 'Paramètres invalides.' });
//     }

//     // Créer une connexion à la base de données
//     const connection = mysql.createConnection({
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME
//     });

//     // Connexion à la base de données
//     connection.connect((err) => {
//         if (err) {
//             console.error("Erreur de connexion à la database :", err);
//             return res.status(500).json({ message: 'Erreur de connexion à la base de données.' });
//         }
//         console.log('Connexion ORDER réussie à la DB de MySQL');
//     });

//     try {
//         // Démarrer la transaction
//         await new Promise((resolve, reject) => {
//             connection.beginTransaction((err) => {
//                 if (err) {
//                     return reject('Erreur lors du début de la transaction');
//                 }
//                 resolve();
//             });
//         });

//         // 1. Créer une commande
//         const [orderResult] = await new Promise((resolve, reject) => {
//             connection.query(
//                 'INSERT INTO orders (user_id) VALUES (?)',
//                 [userId],
//                 (err, results) => {
//                     if (err) return reject(err);
//                     resolve(results);
//                 }
//             );
//         });
//         const orderId = orderResult.insertId;

//         // 2. Insérer les produits dans `order_items`
//         const orderItems = cart.map(item => [
//             orderId,
//             item.id,
//             item.quantity,
//             item.price
//         ]);

//         await new Promise((resolve, reject) => {
//             connection.query(
//                 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
//                 [orderItems],
//                 (err, results) => {
//                     if (err) return reject(err);
//                     resolve(results);
//                 }
//             );
//         });

//         // Valider la transaction
//         await new Promise((resolve, reject) => {
//             connection.commit((err) => {
//                 if (err) return reject('Erreur lors de la validation de la transaction');
//                 resolve();
//             });
//         });

//         res.status(200).json({ message: 'Commande enregistrée avec succès.' });
//     } catch (error) {
//         // Annuler la transaction en cas d'erreur
//         connection.rollback(() => {
//             console.error('Transaction annulée:', error);
//         });
//         res.status(500).json({ message: 'Erreur serveur.' });
//     } finally {
//         // Fermer la connexion
//         connection.end();
//     }
// });




// tjr à la fin
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
