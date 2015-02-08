Template.billingOverview.events({
  'click .cancel-subscription': function(){
    console.log("git ut");
    var confirmCancel = confirm("Are you sure you want to cancel? This means your subscription will no longer be active and your account will be disabled on the cancellation date. If you'd like, you can resubscribe later.");
    if (confirmCancel){
      Meteor.call('stripeCancelSubscription', function(error, response){
        if (error){
          Bert.alert(error.reason, "danger");
        } else {
          if (response.error){
            Bert.alert(response.error.message, "danger");
          } else {
            // Here, just like with changing our plan, we need to toggle the
            // reactivity of our UI helper to ensure the interface updates when
            // this change is made. Otherwise we'll only see it on refresh.
            Session.set('currentUserPlan_' + Meteor.userId(), null);
            Bert.alert("Subscription successfully canceled!", "success");
          }
        }
      });
    }
  }
});
