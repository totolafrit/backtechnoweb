require('dotenv').config(); // Charger les informations de info.env
const express = require('express'); // Créer et gérer le serveur web
const mysql = require('mysql'); // Se connecter à la base de données
const cors = require('cors'); // Recommandé pour gérer certaines API

require('dotenv').config({ path: './info.env' }); // Éviter les problèmes de chemins

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Analyser les requêtes POST
app.use(express.urlencoded({ extended: true }));

// Connexion à la base de données "dbtechnoback"
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

// Test serveur
app.get('/', (req, res) => {
    res.send('Le serveur node.js est fonctionnel');
});

// Middleware pour vérifier si l'utilisateur est admin
function checkAdminRole(req, res, next) {
    const { role } = req.body; // Le rôle devrait être passé depuis le front-end ou vérifié via JWT
    if (role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Droits insuffisants." });
    }
    next();
}

const bcrypt = require('bcrypt'); // Importer bcrypt

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Les champs nom d'utilisateur, email, et mot de passe sont requis." });
    }

    try {
        // Hachage du mot de passe
        const saltRounds = 10; // Nombre de rounds de salage (sécurité)
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

        res.json({
            message: 'Connexion réussie!',
            role: user.role, // Retourner le rôle pour le front-end
        });
    });
});

// Route DELETE pour supprimer un utilisateur (admin uniquement)
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

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
