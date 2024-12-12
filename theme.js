document.addEventListener("DOMContentLoaded", () => {
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const logo = document.querySelector(".logo img"); // Sélectionne le logo

    // Fonction pour appliquer le mode sombre
    const applyDarkTheme = () => {
        document.body.classList.add("dark-theme");
        if (logo) logo.src = "sombre.png"; // Change le logo en mode sombre
        themeToggleBtn.innerHTML = '<i class="bx bx-moon"></i>'; // Icône lune
        localStorage.setItem("theme", "dark");
    };

    // Fonction pour appliquer le mode clair
    const applyLightTheme = () => {
        document.body.classList.remove("dark-theme");
        if (logo) logo.src = "logo.png"; // Change le logo en mode clair
        themeToggleBtn.innerHTML = '<i class="bx bx-sun"></i>'; // Icône soleil
        localStorage.setItem("theme", "light");
    };

    // Appliquer le thème initial en fonction de localStorage
    if (localStorage.getItem("theme") === "dark") {
        applyDarkTheme();
    } else {
        applyLightTheme();
    }

    // Gestion du clic sur le bouton de changement de thème
    themeToggleBtn?.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    });
});
