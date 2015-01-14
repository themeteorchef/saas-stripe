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
        limit        = Meteor.settings.public.plans[plan].limit;

    // Verify that our user has lists available. If so, return true, if they
    // do not, return false.
    if( quota < limit ){
      return true;
    } else {
      return false;
    }
  },

  checkUserPlan: function(user){
    // Check our user argument against our expected pattern.
    check(user, String);

    // Query for our user and get their current plan information.
    var getUser      = Meteor.users.findOne({"_id": user}, {fields: {"profile.subscription.plan": 1}}),
        subscription = getUser.profile.subscription.plan,
        limit        = Meteor.settings.public.plans[subscription.type].limit;

    // If we get a plan and limit back, return them to the client for use. Here,
    // we use a ternary to check whether the limit is greater than one so that
    // we can append the correct contextual string to it.
    if( subscription && limit ){
      var plan = {
        subscription: subscription,
        limit: limit > 1 ? limit + " lists" : limit + " list"
      }
      return plan;
    } else {
      return false;
    }
  }

});
