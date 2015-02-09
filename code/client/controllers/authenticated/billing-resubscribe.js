/*
* Controller: Resubscribe
* Template: /client/views/authenticated/billing/_billing-resubscribe.html
*/

/*
* Rendered
*/

Template.billingResubscribe.rendered = function(){

  $("#resubscribe").validate({
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
        var card = {
          number: $('[name="cardNumber"]').val(),
          exp_month: $('[name="expMo"]').val(),
          exp_year: $('[name="expYr"]').val(),
          cvc: $('[name="cvc"]').val()
        }

        // Call our stripeSwipeCard method to replace our customer's existing
        // card with the new card they've specified.
        Meteor.call("stripeSwapCard", card, function(error, response){
          if (error){
            resubscribeButton.button("reset");
            Bert.alert(error.message, "danger");
          } else {
            // Once we know our customer's card has been updated per their wishes,
            // perform the resubscribe to the plan they've specified.
            updateSubscription(selectedPlan);
          }
        });
      } else {
        // If we're not updating our card first, call to our updateSubscription
        // function, passing the selected plan.
        updateSubscription(selectedPlan);
      }
    }
  });
}

Template.billingResubscribe.events({
  'submit form': function(e){
    e.preventDefault();
  }
});
