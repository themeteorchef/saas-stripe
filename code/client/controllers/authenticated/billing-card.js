Template.billingCard.events({
  'submit form': function( e ){
    e.preventDefault();

    // Again, we get our current user's ID so we can do our Session variable
    // trick to refresh our UI helper. Don't forget our button state, too :)
    var currentUser      = Meteor.userId();
    var updateCardButton = $(".update-card").button('loading');

    // Next, figure out whether we're adding a new card. We can check our
    // addingnewCreditCard Session var here because in addition to controlling
    // the state of our UI, it also lets us know that the user wants to add
    // a new card. Two birds, one stone, booyah!
    var newCard = Session.get('addingNewCreditCard');
    if (newCard){
      // If we're adding a new card, grab the card's details and create a
      // token using Stripe.js.
      STRIPE.getToken( '#billing-card', {
        number: $('[data-stripe="cardNumber"]').val(),
        exp_month: $('[data-stripe="expMo"]').val(),
        exp_year: $('[data-stripe="expYr"]').val(),
        cvc: $('[data-stripe="cvc"]').val()
      }, function() {
        var token = $( "#billing-card [name='stripeToken']" ).val();

        // Call to update our customer's "default" card with what they've passed.
        Meteor.call('stripeSwapCard', token, function(error, response){
          if (error){
            Bert.alert(error.reason.message, 'danger');
            updateCardButton.button('reset');
          } else {
            if (response.rawType !== undefined && response.rawType == "card_error"){
              Bert.alert(response.message, "danger");
              updateCardButton.button('reset');
            } else {
              updateCardButton.button('reset');
              Session.set('currentUserPlan_' + currentUser, null);
              Session.set('addingNewCreditCard', false);
              Bert.alert("New card successfully added!", "success");
            }
          }
        });
      });
    } else {
      // Get our updates from the form.
      var updates = {
        exp_month: $('[name="expMo"]').val(),
        exp_year: $('[name="expYr"]').val()
      };
      // If we're just updating an existing card
      Meteor.call('stripeUpdateCard', updates, function(error, response){
        if (error){
          Bert.alert(error.reason, "danger");
          updateCardButton.button('reset');
        } else {
          // Notice here that we're looking at response.rawType instead of response.error.
          // This is because Stripe will return card error's differently than other errors.
          // This just allows us to confirm the type and alert the appropriate message.
          if (response.rawType !== undefined && response.rawType == "card_error"){
            Bert.alert(response.message, "danger");
            updateCardButton.button('reset');
          } else {
            // If our card was updated succesfully, let the user know. Also, reset our UI
            // as an additional confirmation that everything worked.
            updateCardButton.button('reset');
            $('#billing-card')[0].reset();
            Session.set('currentUserPlan_' + currentUser, null);
            Bert.alert("Credit card successfully updated!", "success");
          }
        }
      });
    }
  }
});
