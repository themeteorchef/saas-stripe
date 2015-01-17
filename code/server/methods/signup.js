/*
* Methods: Signup
* Methods for signing users up and adding them to our database.
*/

var Future = Npm.require('fibers/future');

Meteor.methods({
  createTrialCustomer: function(customer){
    // Check our customer object against our expected pattern.
    check(customer, {
      name: String,
      emailAddress: String,
      password: String,
      plan: String,
      card: {
        number: String,
        exp_month: String,
        exp_year: String,
        cvc: String
      }
    });

    // Create a Future that we can use to confirm successful account creation.
    var newCustomer = new Future();

    // Create our customer.
    Meteor.call('stripeCreateCustomer', customer.card, customer.emailAddress, function(error, stripeCustomer){
      if (error) {
        console.log(error);
      } else {
        var customerId = stripeCustomer.id,
            plan       = customer.plan;
        // Setup a subscription for our new customer.
        Meteor.call('stripeCreateSubscription', customerId, plan, function(error, response){
          if (error) {
            console.log(error);
          } else {
            // Once Stripe is all setup, create our user in the application, adding all
            // of the Stripe data we just received. Note: the third parameter being passed
            // is the "profile" data we want to set for the customer. Change.
            var user = Accounts.createUser({
              email: customer.emailAddress,
              password: customer.password,
              profile: {
                name: customer.name,
                subscription: {
                  plan: {
                    type: customer.plan,
                    lists: 0
                  },
                  payment: {
                    card: {
                      type: stripeCustomer.cards.data[0].brand,
                      lastFour: stripeCustomer.cards.data[0].last4
                    },
                    nextPaymentDue: response.current_period_end
                  }
                }
              }
            });
            // When our new customer is fully baked, return their ID back to our future
            // to complete signup and log the user in on the client. Booyah!
            newCustomer.return(user);
          }
        });
      }
    });

    // Return our newCustomer Future.
    return newCustomer.wait();
  }
});
