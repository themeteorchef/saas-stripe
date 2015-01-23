/*
* Data: Remove Todo Lists
* Method for removing todo lists from the database.
*/

Meteor.methods({
  removeTodoList: function(list){
    // Check our list ID against our expected pattern.
    check(list, String);

    // If argument is valid, perform the removal. In the callback, we lookup the
    // user and make sure to decrement (--) their "lists" number in the profile.
    // This ensures that when a list is removed, the user gains back a list that
    // they can create.
    TodoLists.remove(list, function(error){
      if (error) {
        console.log(error);
      } else {
        // Get the current userId and perform a lookup.
        var user    = Meteor.userId(),
            getUser = Meteor.users.findOne({"_id": user}, {fields: {"subscription.plan.used": 1}});

        // Take the returned number, decrement it, and call the updateUserQuota
        // method to update their account. The -- is a JavaScript operator for
        // removing 1 from the value it's prepended to :)
        var newQuota = --getUser.subscription.plan.used;
        var update   = {auth: SERVER_AUTH_TOKEN, user: user, quota: newQuota};
        // Call the method.
        Meteor.call('updateUserQuota', update, function(error){
          if(error){
            console.log(error);
          }
        });
      }
    });
  }
});
