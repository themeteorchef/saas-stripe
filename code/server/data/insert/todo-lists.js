/*
* Data: Insert Todo Lists
* Method for inserting new todo lists into the database.
*/

Meteor.methods({

  insertTodoList: function(){
    // Because our demo is focused on adding lists to demonstrate quotas,
    // we define a "dummy" list that is automatically inserted when this
    // method (insertTodoList) is called.
    var list = {
      name: "My Awesome Todoodle List"
    }

    // Before we perform the insert, we need to check the user's "quota" value
    // in their profile. If this value is higher than their plan allows, we need
    // to deny the insert and return an error to the client.
    // TODO: Add quota validation.

    // Once we've confirmed the insert is valid, push the list into the
    // collection. Note: we're setting this equal to a variable and returning
    // it from our method so that we can return the generate ID back to the
    // client. We'll then use this ID to route our user. Neat!
    var newList = TodoLists.insert(list);

    return newList;
  }

});
