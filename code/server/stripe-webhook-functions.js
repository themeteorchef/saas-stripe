// Define functions to handle our Stripe requests.
stripeUpdateSubscription = function(request){
  // Because Stripe doesn't have our Meteor user's ID, we need to do a quick
  // lookup on our user's collection per the customerId Stripe gives us.
  var getUser = Meteor.users.findOne({"customerId": request.customer}, {fields: {"_id": 1}});

  if (getUser){
    // Store our update in an object.
    var update = {
      auth: SERVER_AUTH_TOKEN,
      user: getUser._id,
      subscription: {
        status: request.cancel_at_period_end ? "canceled" : request.status,
        ends: request.current_period_end
      }
    }

    // Call to our updateUserSubscription method.
    Meteor.call('updateUserSubscription', update, function(error, response){
      if (error){
        console.log(error);
      }
    });
  }
}
