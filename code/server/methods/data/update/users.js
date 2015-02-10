/*
* Data: Update Users
* Methods for updating users in the database.
*
* Note: these methods are verbose on purpose. Yes, you could combine these into
* one method with tests to see what you're updating, however, this pattern allows
* us to easily separate our logic so we can better understand the order of operations.
*/
Future = Npm.require('fibers/future');

Meteor.methods({

  updateUserQuota: function(update){
    // Check our update argument against our expected pattern.
    check(update, {auth: String, user: String, quota: Number});

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.plan.used": update.quota
        }
      }, function(error){
        if (error) {
          console.log(error);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }
  },

  updateUserPlan: function(update){
    // Check our update argument against our expected pattern.
    check(update, {
      auth: String,
      user: String,
      plan: String,
      status: String,
      date: Number
    });

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.plan.name": update.plan,
          "subscription.ends": update.date,
          "subscription.payment.nextPaymentDue": update.date,
          "subscription.status": update.status
        }
      }, function(error){
        if (error) {
          console.log(error);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }
  },

  updateUserCard: function(update){
    // Check our update argument against our expected pattern.
    check(update, {auth: String, user: String, card: {lastFour: String, type: String}});

    // Here, we need to create a new Future because we'll be returning this information back to
    // our Stripe method. Note, we're mostly doing this because we're "blocking" the return of our
    // update method below in order to check the security of our method call. Certainly a trade-off,
    // but considering it nets us an extra touch of security, not that bad.
    var updateUserCard = new Future();

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.payment.card": update.card
        }
      }, function(error, response){
        if (error) {
          updateUserCard.return(error);
        } else {
          updateUserCard.return(response);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }

    return updateUserCard.wait();
  },

  updateUserSubscription: function(update){
    // Check our update argument against our expected pattern.
    check(update, {auth: String, user: String, subscription: {status: String, ends: Number}});

    // Here, we need to create a new Future because we'll be returning this information back to
    // our Stripe method. Note, we're mostly doing this because we're "blocking" the return of our
    // update method below in order to check the security of our method call. Certainly a trade-off,
    // but considering it nets us an extra touch of security, not that bad.
    var updateUserSubscription = new Future();

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.status": update.subscription.status,
          "subscription.ends": update.subscription.ends,
          "subscription.payment.nextPaymentDue": update.subscription.ends
        }
      }, function(error, response){
        if (error) {
          updateUserSubscription.return(error);
        } else {
          updateUserSubscription.return(response);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }

    return updateUserSubscription.wait();
  }

});
