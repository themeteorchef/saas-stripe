Template.creditCard.helpers({

  isBilling: function(){
    var instance = Template.instance();
    if ( instance.data == "billing" ) {
      return true;
    } else {
      return false;
    }
  },

  addNewCard: function(){
    return Session.get('addingNewCreditCard');
  }
});

Template.creditCard.events({

  'click .add-new-card': function(){
    Session.set('addingNewCreditCard', true);
  },

  'click .cancel-new-card': function(){
    Session.set('addingNewCreditCard', false);
  }
});
