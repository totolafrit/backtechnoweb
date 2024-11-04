const stripe = Stripe('YOUR_PUBLIC_STRIPE_KEY');

document.getElementById('checkout-button').addEventListener('click', () => {
    fetch('/create-checkout-session', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(session => {
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
        if (result.error) {
            alert(result.error.message);
        }
    });
});
