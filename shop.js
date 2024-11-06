<script>
    const categoryCards = document.querySelectorAll('.category-card');
    const articles = document.querySelectorAll('.article');

    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const selectedCategory = card.querySelector('h3').textContent.trim().split(" ")[1];
            articles.forEach(article => {
                const articleCategory = article.getAttribute('data-category');
                if (articleCategory === selectedCategory) {
                    article.style.display = 'block';
                } else {
                    article.style.display = 'none';
                }
            });
        });
    });

    // Afficher tous les articles initialement
    articles.forEach(article => {
        article.style.display = 'block';
    });
</script>
