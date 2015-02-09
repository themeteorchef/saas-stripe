/*
* Server Routes
* Server-side routes for receiving data from third-party services.
*/

Router.route('/webhooks/stripe', function () {
  // Store the request body (what we've been sent from Stripe) in a variable.
  var request = this.request.body;

  // Because Stripe has a boatload of different requests we need to respond to,
  // we setup a switch statement to easily call functions based on what we need.
  // Note: we've setup a separate file to store our functions at:
  // /server/stripe-webhook-functions.js
  switch(request.type){
    case "customer.subscription.updated":
      stripeUpdateSubscription(request.data.object);
      break;
  }

  // Let Stripe know that we receive its request as expected.
  this.response.statusCode = 200;
  this.response.end('Oh hai Stripe!\n');
}, {where: 'server'});
