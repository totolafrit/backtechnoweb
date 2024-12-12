document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const toggleIcons = document.querySelectorAll(".toggle-password");
    const strengthBar = document.getElementById("strength-bar");
    const submitButton = document.querySelector("button[type='submit']");

    // Validation des critères du mot de passe
    function validatePassword(value) {
        const minLength = value.length >= 10;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(value);

        return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
    }

    // Force du mot de passe
    passwordInput.addEventListener("input", () => {
        const value = passwordInput.value;
        let strength = 0;

        if (value.length >= 10) strength++;
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

        // Activer/Désactiver le bouton d'inscription
        submitButton.disabled = !validatePassword(value);
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

    // Validation avant soumission
    submitButton.addEventListener("click", (event) => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!validatePassword(password)) {
            alert(
                "Votre mot de passe doit contenir au moins 10 caractères, avec une majuscule, une minuscule, un chiffre, et un caractère spécial."
            );
            event.preventDefault();
            return;
        }

        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            event.preventDefault();
        }
    });
});
