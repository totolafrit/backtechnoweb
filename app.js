require('dotenv').config({ path: './info.env' }); // pour eviter les problèmes de chemins
const express = require('express'); // créer et gérer le serveur web
const mysql = require('mysql'); // Se connecter à la DB
const cors = require('cors'); // gérer  API
const path = require('path'); // pour def le chemin
const session = require('express-session'); // express-session pour sécuriser chaque session
const jwt = require('jsonwebtoken'); // Assure-toi que jwt est bien importé
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const validator = require('validator');


const router = express.Router();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(xssClean());

app.use('/images', express.static('images')); // middleware pour servir le doc images



app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    objectSrc: ["'none'"],
    imgSrc: ["'self'", "data:"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'"],
  },
}));

// Configurer express-session

  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true, // Empêcher l'accès au cookie via JavaScript
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,// Durée de vie du cookie (1 heure)
      sameSite: 'strict', // Empêche l'envoi de cookies lors des requêtes inter-sites
    }
  }));
  


  const loginLimiter = rateLimit({
    windowMs: 1 * 15 * 1000, // 15 s
    max: 2, // 2 attempts
    message: "Trop de tentatives de connexion, veuillez réessayer après 15 minutes.",
    handler: (req, res) => {

      const remainingAttempts = 2 - req.rateLimit.remaining;
      res.status(429).json({
        message: "Trop de tentatives de connexion.",
        remainingAttempts: remainingAttempts
      });
    }
  });


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

// function checkAdminRole(req, res, next) { // middleware pour vérifier si l'utilisateur est admin
//     const { role } = req.body; // A fair epour secu : le rôle devrait être passé depuis le front-end ou vérifié via JWT
//     if (role !== 'admin') {
//         return res.status(403).json({ message: "Accès refusé. Droits insuffisants." });
//     }
//     next();
// }
function checkAdminRole(req, res, next) {
    const { role } = req.user; // Récupère le rôle à partir du token (req.user)
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

    // Vérification des champs obligatoires
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Les champs nom d'utilisateur, email, et mot de passe sont requis." });
    }

    // Validation de l'email
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "L'email fourni n'est pas valide." });
    }

    // Validation de la longueur du nom d'utilisateur
    if (!validator.isLength(username, { min: 3, max: 20 })) {
        return res.status(400).json({ message: "Le nom d'utilisateur doit être compris entre 3 et 20 caractères." });
    }

    // Validation de la complexité du mot de passe
    if (!validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un symbole." });
    }

    // Vérification que l'email n'est pas déjà utilisé
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error("Erreur lors de la vérification de l'email :", err);
            return res.status(500).json({ message: "Erreur lors de la vérification de l'email." });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hachage du mot de passe
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error("Erreur lors du hachage du mot de passe :", err);
                return res.status(500).json({ message: "Erreur interne lors de la création de l'utilisateur." });
            }

            // Insertion de l'utilisateur dans la base de données
            const userRole = role || 'user';
            const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            db.query(query, [username, email, hashedPassword, userRole], (err, result) => {
                if (err) {
                    console.error("Erreur lors de l'ajout de l'utilisateur :", err);
                    return res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur" });
                }
                res.status(201).json({ message: 'Utilisateur créé avec succès', role: userRole });
            });
        });
    });
});


// Vérification de l'utilisateur
app.post('/check-user', async (req, res) => {
    const { username, email } = req.body;

    try {
        //console.log('Vérification de l\'utilisateur et de l\'email');
        
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, usernameCheck) => {
            if (err) {
                console.error('Erreur lors de la vérification du nom d\'utilisateur:', err);
                return res.status(500).json({ message: 'Erreur du serveur' });
            }
            //console.log('Vérification du nom d\'utilisateur terminée');
            
            if (usernameCheck.length > 0) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
            }

            db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailCheck) => {
                if (err) {
                    console.error('Erreur lors de la vérification de l\'email:', err);
                    return res.status(500).json({ message: 'Erreur du serveur' });
                }
                //console.log('Vérification de l\'email terminée');
                
                if (emailCheck.length > 0) {
                    return res.status(400).json({ message: 'Cette adresse e-mail est déjà utilisée.' });
                }

                res.status(200).json({ message: 'Nom d\'utilisateur et e-mail disponibles.' });
            });
        });
    } catch (error) {
        console.error('Erreur du serveur:', error);
        res.status(500).json({ message: 'Erreur du serveur, veuillez réessayer plus tard.' });
    }
});

// connexion

// Appliquer le rate limiter à la route /login
app.post('/login', loginLimiter, async (req, res) => {
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

        // Générer un JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },  // Payload
            process.env.JWT_SECRET, // Clé secrète (à définir dans .env)
            { expiresIn: '1h' } // Expiration du token (1 heure)
        );
        
        // Répondre avec un message de succès et le token JWT
        res.json({
            message: 'Connexion réussie!',
            userId: user.id,  // ID de l'utilisateur (utile pour la gestion des sessions)
            role: user.role,   // Role de l'utilisateur (utile pour les permissions)
            token: token       // Le token JWT à utiliser pour les requêtes futures
        });
    });
});

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Récupérer le token du header Authorization

    if (!token) {
        return res.status(403).json({ message: 'Token manquant ou invalide' });
    }

    // Vérifier et décoder le token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }

        // Si le token est valide, on ajoute les informations de l'utilisateur décodées dans req.user
        req.user = decoded; // { userId, role }

        next(); // Passer à la route suivante
    });
};

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


// Route pour supprimer une commande par ID
app.delete('/api/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId;  // Récupère l'ID de la commande à partir de l'URL

    // Requête SQL pour supprimer la commande de la table orders
    const query = 'DELETE FROM orders WHERE order_id = ?';

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la suppression de la commande:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression de la commande.' });
        }

        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Commande annulée avec succès.' });
        } else {
            res.status(404).json({ message: 'Commande non trouvée.' });
        }
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


app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
        }
        console.log('Session détruite avec succès');
        res.json({ message: 'Déconnexion réussie' });
    });
});

app.get('/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ message: 'Utilisateur connecté', userId: req.session.userId });
    } else {
        res.json({ message: 'Aucun utilisateur connecté' });
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
// app.get('/api/orders', (req, res) => {

//     const { sort } = req.query; 

//     let orderBy = 'created_at DESC'; // tri par defaut - les commandes les plus recentes 
//     if (sort === 'created_at_asc') orderBy = 'created_at ASC';
//     if (sort === 'total_price_asc') orderBy = 'total_price ASC';
//     if (sort === 'total_price_desc') orderBy = 'total_price DESC';

//     const query = `
//         SELECT 
//             orders.order_id, 
//             orders.user_id, 
//             users.username, 
//             orders.total_price, 
//             orders.cart_items, 
//             orders.created_at, 
//             orders.pickup_date, 
//             orders.pickup_slot   
//         FROM orders
//         JOIN users ON orders.user_id = users.id
//         ORDER BY ${orderBy}
//     `;

//     db.query(query, (err, results) => {
//         if (err) {
//             console.error('Erreur lors de la récupération des commandes :', err);
//             return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
//         }

//         // formatage des résultats
//         const formattedResults = results.map(order => {
//             order.cart_items = JSON.parse(order.cart_items);  // on parse `cart_items` (qui est une chaîne JSON) pour l'utiliser dans le front de manage-orders.html

//             order.created_at = new Date(order.created_at).toISOString(); // changement en format ISO de la date à laquelle la commande a été réalisé
//             order.pickup_date = new Date(order.pickup_date).toISOString();
//             return order;
//         });

//         res.json(formattedResults);
//     });
// });

app.patch('/api/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;  // Par exemple, 'picked_up'

    if (newStatus === 'picked_up') {
        const query = 'UPDATE orders SET status = ?, pickup = NOW() WHERE order_id = ?';
        
        db.query(query, ['picked_up', orderId], (err, results) => {
            if (err) {
                console.error('Erreur lors de la mise à jour du statut de la commande:', err);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de la commande.' });
            }

            if (results.affectedRows > 0) {
                res.status(200).json({ message: 'Commande marquée comme récupérée.' });
            } else {
                res.status(404).json({ message: 'Commande non trouvée.' });
            }
        });
    } else {
        res.status(400).json({ message: 'Statut non valide.' });
    }
});


app.get('/api/orders', (req, res) => {
    const { sort } = req.query;

    let orderBy = 'created_at DESC'; // tri par défaut - les commandes les plus récentes
    if (sort === 'created_at_asc') orderBy = 'created_at ASC';
    if (sort === 'total_price_asc') orderBy = 'total_price ASC';
    if (sort === 'total_price_desc') orderBy = 'total_price DESC';

    // Ajouter une condition pour ne pas récupérer les commandes avec un statut de "récupéré"
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
        WHERE orders.pickup IS NULL  -- Exclure les commandes récupérées
        ORDER BY ${orderBy}
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des commandes :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
        }

        // Formatage des résultats
        const formattedResults = results.map(order => {
            order.cart_items = JSON.parse(order.cart_items);  // Parse `cart_items` pour l'utiliser dans le front-end

            order.created_at = new Date(order.created_at).toISOString(); // Format ISO pour la date
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

  app.get('/api/orders-count', (req, res) => {
    // Connexion à la base de données et récupération du nombre de commandes
    db.query('SELECT COUNT(*) AS orderCount FROM orders', (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération du nombre de commandes:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        res.json({ orderCount: result[0].orderCount });
    });
});

// Route pour obtenir la moyenne du panier
app.get('/api/average-cart-price', (req, res) => {
    const query = 'SELECT AVG(total_price) AS avg_cart_price FROM orders';
    
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération de la moyenne du panier:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des données' });
      } else {
        const avgCartPrice = result[0].avg_cart_price;
        res.json({ avgCartPrice });
      }
    });
  });



// toujours à la fin
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
