/*
* Allow
*/

Meteor.users.allow({
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

Meteor.users.deny({
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
