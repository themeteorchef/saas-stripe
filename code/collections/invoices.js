Invoices = new Meteor.Collection('invoices');

/*
* Allow
*/

Invoices.allow({
  insert: function(){
    return false;
  },
  update: function(){
    return false;
  },
  remove: function(){
    return false;
  }
});

/*
* Deny
*/

Invoices.deny({
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
