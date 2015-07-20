// Note: here, we're setting our publishable key for Stripe.js. This is the
// API key that they use to authenticate our client-side interaction with the API.
// Keep in mind, for demo purposes we're using the TEST publishable key in the
// recipe source. When you go into production, you will need to use the LIVE
// publishable key here.

Meteor.startup(function() {
  var stripeKey = Meteor.settings.public.stripe.testPublishableKey;
  Stripe.setPublishableKey( stripeKey );

  STRIPE = {
    getToken: function( domElement, card, callback ) {
      Stripe.card.createToken( card, function( status, response ) {
        if ( response.error ) {
          // If Stripe sends us an error, alert the user. Notice, we can call our
          // Bert.alert() method to display a client-side alert message because
          // this code is running on the client. Nice!
          Bert.alert( response.error.message, "danger" );
        } else {
          // Call our setToken method below to apply the token to the form.
          STRIPE.setToken( response.id, domElement, callback );
        }
      });
    },
    setToken: function( token, domElement, callback ) {
      // Take our DOM element and append our token as a hidden field.
      $( domElement ).append( $( "<input type='hidden' name='stripeToken' />" ).val( token ) );

      // Call our callback function.
      callback();
    }
  };

});
