function checkUserLink(linkId) {
    const link = document.getElementById(linkId);
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    link.href = isLoggedIn ? "myaccount.html" : "connection.html";
}
