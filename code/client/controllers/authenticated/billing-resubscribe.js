/*
* Controller: Resubscribe
* Template: /client/views/authenticated/billing/_billing-resubscribe.html
*/

Template.billingResubscribe.events({
  'submit form': function(e){
    e.preventDefault();

    // In order to account for the possibility of our customer resubscribing
    // with a new credit card, we need to check whether or not they're doing that.
    var selectedPlan        = $('[name="selectPlan"]:checked').val(),
        addingNewCreditCard = Session.get('addingNewCreditCard'),
        resubscribeButton   = $(".resubscribe").button('loading');

    // Because we'll be reusing one of our methods below, we can wrap it in a
    // function to limit repetition. PeRfOrMaNcE!
    var updateSubscription = function(plan){
      Meteor.call("stripeUpdateSubscription", plan, function(error, response){
        if (error){
          resubscribeButton.button("reset");
          Bert.alert(error.message, "danger");
        } else {
          // If we're resubscribed, go ahead and confirm by returning to the
          // billing overview page and showing an alert message.
          resubscribeButton.button("reset");
          Bert.alert("Successfully resubscribed. Welcome back!", "success");
          Router.go('/billing');
        }
      });
    }

    if (addingNewCreditCard){
      // If we're adding a new card, grab our card data from the template.
      STRIPE.getToken( '#resubscribe', {
        number: $('[data-stripe="cardNumber"]').val(),
        exp_month: $('[data-stripe="expMo"]').val(),
        exp_year: $('[data-stripe="expYr"]').val(),
        cvc: $('[data-stripe="cvc"]').val()
      }, function() {
        var token = $( "#resubscribe [name='stripeToken']" ).val();

        // Call our stripeSwipeCard method to replace our customer's existing
        // card with the new card they've specified.
        Meteor.call("stripeSwapCard", token, function(error, response){
          if (error){
            resubscribeButton.button("reset");
            Bert.alert(error.message, "danger");
          } else {
            // Once we know our customer's card has been updated per their wishes,
            // perform the resubscribe to the plan they've specified.
            updateSubscription(selectedPlan);
          }
        });
      });
    } else {
      // If we're not updating our card first, call to our updateSubscription
      // function, passing the selected plan.
      updateSubscription(selectedPlan);
    }
  }
});
