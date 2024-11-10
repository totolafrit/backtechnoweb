require('dotenv').config(); // recup les infos de info.env
const express = require('express'); // créer et gerer le serv web
const mysql = require('mysql'); // se connecter à la db, vérifiez les infos dans info.env
const cors = require('cors'); // recommander pour gérer certaines API

require('dotenv').config({ path: './info.env' }); // pour éviter des problèmes de chemins 


const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json()); //analyse les requees post
app.use(express.urlencoded({ extended: true }));

// connexion a la db "dbtechnoback" 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => { // si erreur ici vérifiez le port ou les variables dans du fichier .env
    if (err) {
        console.error("Erreur de connexion à la database :", err);
        return;
    }
    console.log('Connection résussi à la DB de MySQL');
});

app.get('/', (req, res) => { // test serveur - voir console
    res.send('Le serveur node.js est fonctionnel');
});

// route POST pour crer un utilisateur
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) { // envoie l'erreur 400 s'il manque une des variables
        return res.status(400).json({ message: "Les champs nom d'utilisateur, email, et mot de passe sont requis." });
    }

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'; // ajout des infos dans la db

    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'ajout de l'utilisateur :", err);
            return res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur" });
        }
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    });
});

// route Post pour la connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
    }

    const query = 'SELECT * FROM users WHERE username = ?'; // simple commande pour récup facilement toutes les infos
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error("Erreur lors de la connexion :", err);
            return res.status(500).json({ message: 'Erreur lors de la connexion' });
        }

        if (results.length === 0 || results[0].password !== password) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
        }

        return res.json({ message: 'Connexion réussie!' });
       
    });
});


app.listen(PORT, () => { // mettre le listen apres les routes post
    console.log(`Serveur démarré sur le port ${PORT}`);
});
