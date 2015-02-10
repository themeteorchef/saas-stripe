/*
* Stripe Webhook Functions
* Functions for handling data sent to us from Stripe via webhooks.
*/

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

stripeCreateInvoice = function(request){
  // Because Stripe doesn't have our Meteor user's ID, we need to do a quick
  // lookup on our user's collection per the customerId Stripe gives us.
  var getUser = Meteor.users.findOne({"customerId": request.customer}, {fields: {"_id": 1, "emails.address": 1}});

  if (getUser){
    // Cache the invoice item from Stripe.
    var invoiceItem = request.lines.data[0];
    var totalAmount = request.total;

    // Make sure that our invoice is greater than $0. We do this because Stripe
    // generates an invoice for our customer's trial (for $0), even though they
    // technically haven't *paid* anything.
    if (totalAmount > 0) {
      // Setup an invoice object.
      var invoice = {
        owner: getUser._id,
        email: getUser.emails[0].address,
        date: request.date,
        planId: invoiceItem.plan.id,
        ends: invoiceItem.period.end,
        amount: totalAmount,
        transactionId: Random.hexString(10)
      }

      // Perform our insert. Note: we're doing this here because we'll only ever
      // add invoices via this function. Since we're not sharing it with another
      // operation in the app, we can just isolate it here.
      Invoices.insert(invoice, function(error, response){
        if (error){
          console.log(error);
        }
      });
    }
  }
}
