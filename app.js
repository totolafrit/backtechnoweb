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

const bcrypt = require('bcrypt'); // methode pour hasher les mdp


//////////////// Routes ////////////////

//create un compte

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Les champs nom d'utilisateur, email, et mot de passe sont requis." });
    }

    try {
        // hachage du mdp
        const saltRounds = 10; // nombre de rounds de salage
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


// connexion

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

        res.json({
            message: 'Connexion réussie!',
            userId: user.id,  // ajout de luserId
            role: user.role,   // utile pour se connecter en tant qu'admin
        });
    });
});






// // Mettre à jour les informations d'un utilisateur
// app.put('/user/:id', async (req, res) => {
//     const userId = req.params.id;
//     const { username, email } = req.body;

//     try {
//         const [result] = await db.query(
//             'UPDATE users SET username = ?, email = ? WHERE id = ?',
//             [username, email, userId]
//         );

//         if (result.affectedRows > 0) {
//             res.json({ message: "Informations mises à jour avec succès" });
//         } else {
//             res.status(404).json({ message: "Utilisateur non trouvé" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Erreur du serveur", error });
//     }
// });



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

// Ajout d'un produit (admin)

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


// Récupérer les informations d'un utilisateur par son ID 

// app.get('/api/users', (req, res) => {
//     const query = 'SELECT * FROM users';
//     db.query(query, (err, result) => {
//         if (err) {
//             console.error('Erreur lors de la récupération des produits:', err);
//             return res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
//         }
//         res.status(200).json(result);  
//     });
// });


// app.get('/api/users', (req, res) => {
//     const username = req.query.username;  // Récupérer le username passé dans la requête
//     const query = 'SELECT * FROM users WHERE username = ?';  // Sélectionner l'utilisateur par username
    
//     db.query(query, [username], (err, result) => {
//         if (err) {
//             console.error('Erreur lors de la récupération des utilisateurs:', err);
//             return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
//         }
//         if (result.length === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé' });
//         }
//         res.status(200).json(result[0]);  // Renvoyer le premier utilisateur trouvé
//     });
// });


app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;  // Récupère l'ID de l'utilisateur depuis l'URL
    const query = 'SELECT * FROM users WHERE id = ?';  // Sélectionne l'utilisateur par ID
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(result[0]);  // Renvoyer l'utilisateur correspondant
    });
});

// modif profil cote client

app.put('/api/users/profile/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ message: 'Nom d\'utilisateur et email sont requis.' });
    }

    const query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    db.query(query, [username, email, userId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: 'Informations personnelles mises à jour avec succès.' });
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


// produit par ID

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


// route pour recup tous les users
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

// route pour recup un user par ID
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

//rute pour mettre à jour un user côté admin
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

// route pour suppr un user
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

// route pour ajouter un user
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


// Mise à jour du mot de passe
app.put('/api/users/:id/change-password', (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    //console.log("ID reçu :", id);
    //console.log("Ancien mot de passe :", currentPassword);
    //console.log("Nouveau mot de passe :", newPassword);

    db.query("SELECT * FROM users WHERE id = ?", [id], async (err, rows) => {
        if (err) {
            console.error("Erreur lors de la requête :", err);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération de l'utilisateur" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        //console.log("Correspondance des mots de passe :", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe actuel incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        //console.log("Nouveau mot de passe haché :", hashedPassword);

        db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la mise à jour du mot de passe :", err);
                return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du mot de passe" });
            }

            res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
        });
    });
});



// route pour enregistrer une commande
       

app.post('/create-order', (req, res) => {
    const { userId, cart, totalPrice, pickupDate, pickupSlot } = req.body;
    //console.log('Données reçues:', { userId, cart, totalPrice, pickupDate, pickupSlot });

    const query = `INSERT INTO orders (user_id, total_price, cart_items, created_at, pickup_date, pickup_slot)
                   VALUES (?, ?, ?, NOW(), ?, ?)`;

    db.query(query, [userId, totalPrice, JSON.stringify(cart), pickupDate, pickupSlot], (err, result) => {
        if (err) {
            console.error('Erreur de requête SQL:', err);
            return res.status(500).json({ message: 'Erreur lors de la création de la commande' });
        }

        res.status(200).json({ message: 'Commande créée avec succès' });
    });
});





// route pour récupérer les commandes côté admin
app.get('/api/orders', (req, res) => {

    const { sort } = req.query; 

    let orderBy = 'created_at DESC'; // tri par defaut - les commandes les plus recentes 
    if (sort === 'created_at_asc') orderBy = 'created_at ASC';
    if (sort === 'total_price_asc') orderBy = 'total_price ASC';
    if (sort === 'total_price_desc') orderBy = 'total_price DESC';

    const query = `
        SELECT 
            orders.order_id, 
            orders.user_id, 
            users.username, 
            orders.total_price, 
            orders.cart_items, 
            orders.created_at, 
            orders.pickup_date, 
            orders.pickup_slot   
        FROM orders
        JOIN users ON orders.user_id = users.id
        ORDER BY ${orderBy}
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des commandes :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
        }

        // formatage des résultats
        const formattedResults = results.map(order => {
            order.cart_items = JSON.parse(order.cart_items);  // on parse `cart_items` (qui est une chaîne JSON) pour l'utiliser dans le front de manage-orders.html

            order.created_at = new Date(order.created_at).toISOString(); // changement en format ISO de la date à laquelle la commande a été réalisé
            order.pickup_date = new Date(order.pickup_date).toISOString();
            return order;
        });

        res.json(formattedResults);
    });
});


// route pour recupérer les commandes coté client
app.get('/api/orders/user/:userId', (req, res) => {
    const { sort } = req.query; 
    const userId = req.params.userId; // Récupérer l'userId à partir des paramètres d'URL

    let orderBy = 'created_at DESC'; // tri par défaut - les commandes les plus récentes 
    if (sort === 'created_at_asc') orderBy = 'created_at ASC';
    if (sort === 'total_price_asc') orderBy = 'total_price ASC';
    if (sort === 'total_price_desc') orderBy = 'total_price DESC';

    // Créer la requête SQL avec un filtre basé sur le user_id
    const query = `
        SELECT 
            orders.order_id, 
            orders.user_id, 
            users.username, 
            orders.total_price, 
            orders.cart_items, 
            orders.created_at 
        FROM orders
        JOIN users ON orders.user_id = users.id
        WHERE orders.user_id = ?
        ORDER BY ${orderBy}
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des commandes :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
        }

        // Formatage des résultats
        const formattedResults = results.map(order => {
            order.cart_items = JSON.parse(order.cart_items);  // On parse `cart_items` (qui est une chaîne JSON) pour l'utiliser dans le front
            order.created_at = new Date(order.created_at).toISOString(); // Format ISO pour la date

            return order;
        });

        res.json(formattedResults);  // Renvoi des commandes de l'utilisateur sous format JSON
    });
});

// Route pour récupérer le nombre d'utilisateurs (clients)
app.get('/api/clients-count', (req, res) => {
    // On compte tous les utilisateurs dans la table "users"
    db.query('SELECT COUNT(*) AS clientCount FROM users', (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ clientCount: result[0].clientCount });
      }
    });
  });


// toujours à la fin
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
