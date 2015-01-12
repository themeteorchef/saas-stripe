TodoLists = new Meteor.Collection('todo-lists');

/*
* Allow
*/

TodoLists.allow({
  insert: function(){
    return false;
  },
  update: function(){
    return false;
  },
  remove: function(userId, doc){
    return false;
  }
});

/*
* Deny
*/

Example.deny({
  insert: function(){
    return true;
  },
  update: function(){
    return true;
  },
  remove: function(){
    return true;
  }
});
