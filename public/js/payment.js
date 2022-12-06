const stripe = Stripe(
  "pk_test_51L8eLHSDweWo1JOFJ7kUfSFxEtMk8x1NlQMZtx9WywR9xAJEW0ZNpAVczEtYTJerCNmkqyFAzYKzQpQ6z30CLL7I00N1FFGxpF"
);
const sessionID = document.getElementById("sessionID-input").value;
const orderBtn = document.getElementById("order-btn");
orderBtn.addEventListener("click", function () {
  stripe.redirectToCheckout({
    sessionId: sessionID,
  });
});
