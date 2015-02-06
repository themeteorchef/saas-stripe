Template.billingPlan.helpers({
  plans: function(){
    var getPlans = Meteor.settings.public.plans;
    if (getPlans) {
      return getPlans;
    }
  },
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
  downgradeAvailable: function(limit){
    // Tricky! Because our upgradeAvailable is automatically setting the value of
    // Session.get('getUserPlan_' + currentUser) for us, we can simply call to this
    // and test against it :) Here, we target the plan object and the used key to
    // check whether or not the user has used more lists than the plan they can
    // downgrade to. If they haven't, the downgrade is available. If they have, well,
    // no downgrade for you!
    var currentUser = Meteor.userId();
    var getPlan     = Session.get('getUserPlan_' + currentUser);
    if (getPlan){
      var used = getPlan.subscription.plan.used;
      return used <= limit ? true : false;
    }
  }
});

Template.billingPlan.events({
  'click .downgrade-upgrade': function(e){
    // Nifty! Meteor is a total nerd and gives us access to the current iterated
    // object in an {{#each}} block as "this."
    var plan            = this.name;
    // Ahh smell that UX fresh in the morning. Cock-a-doodle-doo indeed!
    var downgradeUpgradeButton = $(e.target).button('loading');
    // Before we update our user, let's make sure they're certain they want to do this...
    var confirmPlanChange = confirm("Are you sure you want to change your plan?");
    // If we get a positive confirmation, call to our stripeUpdateSubscription method on the server.
    if (confirmPlanChange){
      Meteor.call('stripeUpdateSubscription', plan, function(error, response){
        if (error){
          // If we get an error, log it out so we can see what's wrong.
          downgradeUpgradeButton.button('reset');
          Bert.alert(error.reason, "danger");
        } else {
          if (response.error){
            Bert.alert(response.error.message, "danger");
          } else {
            // If our method succeeds, we reset our button and then we update our
            // currentUserPlan_ session variable to be null. What? We do this here
            // because by default, our UI helper for marking the user's current plan
            // is NOT reactive. Here, we change the currentUserPlan_ session variable,
            // because know 1.) that it's a reactive data store, and 2.) that our UI
            // helper depends on it. So, by changing it to null, we force our UI helper
            // to rerun and pull down the updated information from the user. Woah smokies.
            downgradeUpgradeButton.button('reset');
            Session.set('currentUserPlan_' + Meteor.userId(), null);
            Bert.alert("Subscription successfully updated!", "success");
          }
        }
      });
    } else {
      downgradeUpgradeButton.button('reset');
    }
  }
});
