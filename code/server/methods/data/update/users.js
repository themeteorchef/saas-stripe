/*
* Data: Update Users
* Methods for updating users in the database.
*
* Note: these methods are verbose on purpose. Yes, you could combine these into
* one method with tests to see what you're updating, however, this pattern allows
* us to easily separate our logic so we can better understand the order of operations.
*/

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
    check(update, {auth: String, user: String, plan: String});

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.plan.name": update.plan
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

    // Before we perform the update, ensure that the auth token passed is valid.
    if ( update.auth == SERVER_AUTH_TOKEN ){
      // If arguments are valid, continue with updating the user.
      Meteor.users.update(update.user, {
        $set: {
          "subscription.payment.card": update.card
        }
      }, function(error){
        if (error) {
          console.log(error);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }
  }

});
