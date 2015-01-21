/*
* Data: Update Users
* Methods for updating users in the database.
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
          "profile.subscription.plan.used": update.quota
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
