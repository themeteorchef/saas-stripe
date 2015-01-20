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
        userPlan     = subscription.type,
        quota        = subscription.lists;

    // Find the correct plan in our plans array (defined in /settings.json).
    var plansArray = Meteor.settings.public.plans;
    var getPlan    = _.find(plansArray, function(plan){ return plan.name == userPlan; });
    var limit      = getPlan.limit;

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
    var getUser      = Meteor.users.findOne({"_id": user}, {fields: {"profile.subscription": 1}}),
        subscription = getUser.profile.subscription;

    // Find the correct plan in our plans array (defined in /settings.json).
    var plansArray = Meteor.settings.public.plans;
    var getPlan    = _.find(plansArray, function(plan){ return plan.name == subscription.plan.type; });
    var limit      = getPlan.limit;
    var usd        = getPlan.amount.usd;

    // If we get a plan and limit back, return them to the client for use. Here,
    // we use a ternary to check whether the limit is greater than one so that
    // we can append the correct contextual string to it.
    if( subscription && limit ){
      var plan = {
        subscription: subscription,
        limit: limit > 1 ? limit + " lists" : limit + " list",
        amount: usd
      }
      console.log(plan);
      return plan;
    } else {
      return false;
    }
  }

});
