Template.billingPlan.helpers({
  upgradeAvailable: function(iteratedPlanAmount){
    // Get the current user so we can look them up.
    var currentUser = Meteor.userId();
    var getPlan     = Session.get('getUserPlan_' + currentUser);

    // Get our user's plan data by calling to our existing checkUserPlan method.
    Meteor.call('checkUserPlan', currentUser, function(error, response){
      if ( error ) {
        console.log(error);
      } else {
        Session.set('getUserPlan_' + currentUser, response);
      }
    });

    if (getPlan){
      // Because we're getting back our customer's plan cost back as a string
      // prefixed with a $ symbol, we need to strip this and convert it back to
      // a number using parseInt(). Afterward, we can multiply the value we get
      // by a hundred to get the correct numbers of cents (e.g. 10 * 100 cents
      // in a dollar = 1000). Note: we do a replace() on the $ symbol here
      // because if we pass the raw string to parseInt() it breaks.
      var currentPlanAmount = parseInt( getPlan.amount.replace("$", "") ) * 100;
      return currentPlanAmount < iteratedPlanAmount ? true : false;
    }
  },
  plans: function(){
    var getPlans = Meteor.settings.public.plans;
    if (getPlans) {
      return getPlans;
    }
  }
});
