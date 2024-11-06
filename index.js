const express = require('express');
const app = express();
//const PORT = process.env.PORT || 3000;

// Middleware et routes de base
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur Express');
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
