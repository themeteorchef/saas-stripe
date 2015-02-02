/*
* Methods: Stripe
* Methods for interacting with the Stripe API. Because we'll interact with the
* Stripe API in a number of different ways, we want to break up the various
* functions into multiple methods. This will allow us to define each function
* once, while reusing them multiple times in our application. Sweet!
*/

// Grab our testSecretKey from /settings.json. Note: we're using our TEST secret
// because we're in TEST mode in the Stripe dashboard (that little LIVE <=> TEST
// toggle at the top left). Note: this is a bit confusing. Toggling this switch
// the first time activates "Live" mode on your account, however, this does NOT
// disable TEST mode. Further, toggling back to TEST once you're in production
// does NOT disable LIVE mode. Rather, each side (LIVE or TEST) shows the data
// generated associated with your test and/or live keys. So, you can still do
// tests locally and see that data in the dashboard before going into production.
var secret = Meteor.settings.private.stripe.testSecretKey;
var Stripe = Meteor.npmRequire('stripe')(secret);
var Future = Npm.require('fibers/future');
var Fiber  = Npm.require('fibers');

Meteor.methods({

  stripeCreateToken: function(card){
    // Check our argument against the expected pattern. This is especially important
    // here because we're dealing with sensitive customer information.
    check(card, {
      number: String,
      exp_month: String,
      exp_year: String,
      cvc: String
    });

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeToken = new Future();

    // If all is well, call to the Stripe API to create our token!
    Stripe.tokens.create({
      card: card // Pass our card object to the "card" parameter.
    }, function(error, token){
      if (error){
        // If we get an error, return it to our "waiting" return object.
        stripeToken.return(error);
      } else {
        // If we get a token, return it to our "waiting" return object.
        stripeToken.return(token.id);
      }
    });

    return stripeToken.wait();
  },

  stripeCreateCustomer: function(card, email){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(card, {
      number: String,
      exp_month: String,
      exp_year: String,
      cvc: String
    });

    check(email, String);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeCustomer = new Future();

    // If all is well, call to the Stripe API to create our customer!
    // Note: here, we're passing a card as well. Why? Because we're only creating
    // customers when they sign up for our app, Stripe gives us the option to pass
    // card data here, too, automating the token creation process. We could
    // technically run the stripeCreateToken method above and pass the token to
    // this method, but this saves us a step. Efficient!
    Stripe.customers.create({
      card: card,
      email: email
    }, function(error, customer){
      if (error){
        stripeCustomer.return(error);
      } else {
        stripeCustomer.return(customer);
      }
    });

    return stripeCustomer.wait();
  },

  stripeCreateSubscription: function(customer, plan){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customer, String);
    check(plan, String);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeSubscription = new Future();

    // If all is well, call to the Stripe API to create our subscription!
    // Note: here, we're only passing the customerId (created by Stripe) and the
    // name of the plan. To setup our plans, we'll visit: https://dashboard.stripe.com/test/plans
    // and define them in the Stripe dashboard (the plan name will match an ID
    // we set in the dashboard, equal to the lowercase name of the plan).
    Stripe.customers.createSubscription(customer, {
      plan: plan
    }, function(error, subscription){
      if (error) {
        stripeSubscription.return(error);
      } else {
        stripeSubscription.return(subscription);
      }
    });

    return stripeSubscription.wait();
  },

  stripeUpdateSubscription: function(plan){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(plan, String);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it. Yes, we could use Meteor.wrapAsync to simplify our code
    // a bit, but I've choosen to demonstrate this here so we can better see *how*
    // the function is responding. Put down that pitchfork.
    var stripeUpdateSubscription = new Future();

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    // If all is well, call to the Stripe API to update our subscription! Note:
    // here we have to pass *both* the ID of the customer and the ID of their
    // subscription in order for this to work.
    Stripe.customers.updateSubscription(getUser.customerId, {
      plan: plan
    }, function(error, subscription){
      if (error) {
        stripeUpdateSubscription.return(error);
      } else {
        // Here, we know that updating our user's subscription will *only* be used
        // to manage plan's, so, we run our user update method here to keep things simple.
        // First we create our update object (don't forget SERVER_AUTH_TOKEN)...
        // Note: we're using a Fiber() here because we're calling to Meteor code from
        // within async function's callback (this will cause Meteor to throw an error).
        Fiber(function(){
          var update = {
            auth: SERVER_AUTH_TOKEN,
            user: user,
            plan: plan
          }
          // And then we pass our update over to our updateUserPlan method.
          Meteor.call('updateUserPlan', update, function(error, response){
            if (error){
              console.log(error);
            } else {
              stripeUpdateSubscription.return(response);
            }
          });
        }).run();
      }
    });

    return stripeUpdateSubscription.wait();
  },

  stripeRetrieveCustomer: function(customer){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customer, String);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeRetrieveCustomer = new Future();

    // If all is well, call to the Stripe API to update our subscription! Note:
    // here we have to pass *both* the ID of the customer and the ID of their
    // subscription in order for this to work.
    Stripe.customers.retrieve(customer, function(error, customer){
      if (error) {
        stripeRetrieveCustomer.return(error);
      } else {
        stripeRetrieveCustomer.return(customer);
      }
    });

    return stripeRetrieveCustomer.wait();
  },

  stripeUpdateCard: function(customer, card, updates){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customer, String);
    check(card, String);
    check(updates, Object);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeUpdateCard = new Future();

    // If all is well, call to the Stripe API to update our card!
    Stripe.customers.updateCard(customer, card, updates, function(error, customer){
      if (error) {
        stripeUpdateCard.return(error);
      } else {
        stripeUpdateCard.return(customer);
      }
    });

    return stripeUpdateCard.wait();
  },

  stripeCreateCard: function(customer, cardToken){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customer, String);
    check(cardToken, String);

    // Because Stripe's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var stripeCreateCard = new Future();

    // If all is well, call to the Stripe API to create our new card on our customer!
    // Note: our stripeCreateCard method is not the same as creating a token. The difference
    // here is that this creates a card _on our customer_ not the card token itself. To
    // get our token, we'd call to our stripeCreateToken method.
    Stripe.customers.createCard(customer, {
      card: cardToken
    }, function(error, customer){
      if (error) {
        stripeCreateCard.return(error);
      } else {
        stripeCreateCard.return(customer);
      }
    });

    return stripeCreateCard.wait();
  }
});
