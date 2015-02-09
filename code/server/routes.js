/*
* Server Routes
* Server-side routes for receiving data from third-party services.
*/

Router.route('/webhooks/stripe', function () {
  // Store the request body (what we've been sent from Stripe) in a variable.
  // We drill down to the body, here, as the full request contains some data that
  // isn't relevant to the functions we'll call below.
  var request = this.request.body;

  // Because Stripe has a boatload of different requests we need to respond to,
  // we setup a switch statement to easily call functions based on what we need.
  // Note: we've setup a separate file to store our functions at:
  // /server/stripe-webhook-functions.js. Keep in mind, for our demo we're only
  // focusing on two of the 49 event types available. In your own app, depending
  // on how you will rely on webhooks, you'll need to add support for the others.
  // See: https://stripe.com/docs/api#event_types for a full list of events.
  switch(request.type){
    case "customer.subscription.updated":
      stripeUpdateSubscription(request.data.object);
      break;
    case "invoice.payment_succeeded":
      stripeCreateInvoice(request.data.object);
      break;
  }

  // Let Stripe know that we receive its request as expected.
  this.response.statusCode = 200;
  this.response.end('Oh hai Stripe!\n');
}, {where: 'server'});
