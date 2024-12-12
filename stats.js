<script>
    // Sélection des éléments
    const modal = document.getElementById('chartModal');
    const closeBtn = document.querySelector('.close-btn');
    const chartCanvas = document.getElementById('chartCanvas');
    let myChart;

    // Fonction pour ouvrir le modal avec le graphique
    function openChart(metric) {
        // Récupérer les données en fonction de la métrique
        const data = getDataForMetric(metric);

        // Afficher le modal
        modal.style.display = 'block';

        // Détruire le graphique précédent s'il existe
        if (myChart) {
            myChart.destroy();
        }

        // Créer le nouveau graphique
        myChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label,
                    data: data.values,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: data.unit
                        }
                    }
                }
            }
        });
    }

    // Fermer le modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Ajouter des événements aux boutons "Historique"
    const historyButtons = document.querySelectorAll('.history-btn');
    historyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const metric = button.getAttribute('data-metric');
            openChart(metric);
        });
    });

    // Fonction pour récupérer les données (simulation)
    function getDataForMetric(metric) {
        // Ici, vous devriez récupérer les données réelles depuis votre serveur
        // Pour la démonstration, nous allons utiliser des données simulées

        const data = {
            labels: [], // Dates
            values: [], // Valeurs correspondantes
            label: '',
            unit: ''
        };

        // Générer des dates pour le mois passé
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            data.labels.push(date.toLocaleDateString('fr-FR'));
        }

        // Générer des valeurs aléatoires pour la démonstration
        for (let i = 0; i < 30; i++) {
            switch (metric) {
                case 'top-pages':
                    data.values.push(Math.floor(Math.random() * 200) + 50);
                    data.label = 'Top Pages';
                    data.unit = 'Pages vues';
                    break;
                case 'session-duration':
                    data.values.push((Math.random() * 5 + 1).toFixed(2));
                    data.label = 'Durée Moyenne des Sessions';
                    data.unit = 'Minutes';
                    break;
                case 'bounce-rate':
                    data.values.push(Math.floor(Math.random() * 50) + 10);
                    data.label = 'Taux de Rebond';
                    data.unit = '%';
                    break;
                case 'unique-visitors':
                    data.values.push(Math.floor(Math.random() * 500) + 100);
                    data.label = 'Visiteurs Uniques';
                    data.unit = 'Visiteurs';
                    break;
            }
        }

        return data;
    }
</script>
