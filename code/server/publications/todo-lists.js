/*
* Publications: Todo Lists
* Publish data from the TodoLists collection.
*/

// userLists
Meteor.publish('userLists', function(){
  // Publish only the lists for the current user. We can make use of this.userId
  // in our publication to get the user's ID. If we find lists for the user,
  // publish them to the client.
  var user     = this.userId,
      getLists = TodoLists.find({"owner": user});

  if (getLists){
    return getLists;
  }
});

Meteor.publish('list', function(listId){
  // Check our passed listId against our expected pattern.
  check(listId, String);
  // Publish the current list owned by the current user. We can make use of
  // this.userId in our publication to get the user's ID. If we find the list
  // for the user, publish it to the client.
  var user     = this.userId,
      getList  = TodoLists.find({"_id": listId, "owner": user});

  if (getList){
    return getList;
  }
});
