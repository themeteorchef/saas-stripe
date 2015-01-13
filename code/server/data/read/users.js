/*
* Data: Read Users
* Methods for reading user data in the database.
*/

Meteor.methods({

  checkUserQuota: function(user){
    // Check our user argument against our expected pattern.
    check(user, String);

    // Query for our user and get their current quota.
    var getUser      = Meteor.users.findOne({"_id": user}, {fields: {"profile.subscription.plan": 1}}),
        subscription = getUser.profile.subscription.plan,
        plan         = subscription.type,
        quota        = subscription.lists,
        limit        = TODOODLE_PLANS[plan].limit;

    // Verify that our user has lists available. If so, return true, if they
    // do not, return false.
    if( quota < limit ){
      return true;
    } else {
      return false;
    }
  }

});
