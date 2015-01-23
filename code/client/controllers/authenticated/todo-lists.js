/*
*  Controller: Todo Lists
*  Template: /client/views/authenticated/todo-lists.html
*/

/*
* Helpers
*/

Template.todoLists.helpers({
  listsAvailable: function(){
    // Get the current user and setup a unique session variable bound to their
    // userId. Assign the session variable equal to the return value of the helper.
    var user      = Meteor.userId(),
        available = Session.get('userListsAvailable_' + user);
    // If we have a user, call to checkUserQuota on the server to determine
    // whether or not the user has hit their current plan's limit.
    if ( user ) {
      Meteor.call('checkUserQuota', user, function(error, response){
        if (error) {
          alert(error.reason);
        } else {
          // Get the response from the server and set it equal to the user's
          // unique session variable (this will be either true or false).
          Session.set('userListsAvailable_' + user, response);
        }
      });
    }
    // Return the result of the method being called.
    return available;
  },
  
  lists: function(){
    // Get our current user and return all of the lists in the database owned
    // by that user.
    var user  = Meteor.userId(),
        lists = TodoLists.find({"owner": user});

    // If we have lists, return them.
    if (lists) {
      return lists;
    }
  }
});

/*
* Events
*/

Template.todoLists.events({
  'click .btn-success': function() {
    Meteor.call('insertTodoList', function(error,response){
      if (error) {
        alert(error.reason);
      } else {
        Router.go('/lists/' + response);
      }
    });
  }
});
