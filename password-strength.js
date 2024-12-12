document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("password");
    const toggleIcons = document.querySelectorAll(".toggle-password");
    const strengthBar = document.getElementById("strength-bar");

    // Force du mot de passe
    passwordInput.addEventListener("input", () => {
        const value = passwordInput.value;
        let strength = 0;

        if (value.length >= 8) strength++;
        if (/[A-Z]/.test(value)) strength++;
        if (/[a-z]/.test(value)) strength++;
        if (/[0-9]/.test(value)) strength++;
        if (/[^A-Za-z0-9]/.test(value)) strength++;

        // Mise à jour de la barre
        switch (strength) {
            case 1:
                strengthBar.style.width = "20%";
                strengthBar.style.backgroundColor = "red";
                break;
            case 2:
                strengthBar.style.width = "40%";
                strengthBar.style.backgroundColor = "orange";
                break;
            case 3:
                strengthBar.style.width = "60%";
                strengthBar.style.backgroundColor = "yellow";
                break;
            case 4:
                strengthBar.style.width = "80%";
                strengthBar.style.backgroundColor = "lightgreen";
                break;
            case 5:
                strengthBar.style.width = "100%";
                strengthBar.style.backgroundColor = "green";
                break;
            default:
                strengthBar.style.width = "0%";
                strengthBar.style.backgroundColor = "red";
        }
    });

    // Icône pour révéler/cacher le mot de passe
    toggleIcons.forEach((icon) => {
        icon.addEventListener("click", () => {
            const input = icon.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("bx-hide", "bx-show");
            } else {
                input.type = "password";
                icon.classList.replace("bx-show", "bx-hide");
            }
        });
    });
});
