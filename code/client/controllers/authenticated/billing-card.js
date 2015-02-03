Template.billingCard.rendered = function(){

  $('#billing-card').validate({
    rules: {
      cardNumber: {
        creditcard: true,
        required: true
      },
      expMo: {
        required: true
      },
      expYr: {
        required: true
      },
      cvc: {
        required: true
      }
    },
    messages: {
      cardNumber: {
        creditcard: "Please enter a valid credit card.",
        required: "Required."
      },
      expMo: {
        required: "Required."
      },
      expYr: {
        required: "Required."
      },
      cvc: {
        required: "Required."
      }
    },
    submitHandler: function(){
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
        // If we're adding a new card, grab the card's details...
        var card = {
          number: $('[name="cardNumber"]').val(),
          exp_month: $('[name="expMo"]').val(),
          exp_year: $('[name="expYr"]').val(),
          cvc: $('[name="cvc"]').val()
        }
        // Call to update our customer's "default" card with what they've passed.
        Meteor.call('stripeSwapCard', card, function(error, response){
          if (error){
            updateCardButton.button('reset');
            console.log(error);
          } else {
            updateCardButton.button('reset');
            Session.set('currentUserPlan_' + currentUser, null);
            Session.set('addingNewCreditCard', false);
          }
        });
      } else {
        // Get our updates from the form.
        var updates = {
          exp_month: $('[name="expMo"]').val(),
          exp_year: $('[name="expYr"]').val()
        }
        // If we're just updating an existing card
        Meteor.call('stripeUpdateCard', updates, function(error, response){
          if (error){
            console.log(error);
          } else {
            // Every time you don't DRY your code an angry developer swears at
            // a fast food employee.
            updateCardButton.button('reset');
            Session.set('currentUserPlan_' + currentUser, null);
          }
        });
      }
    }
  });

}

Template.billingCard.events({
  'submit form': function(){
    e.preventDefault();
  }
});
