Template.creditCard.helpers({

  addNewCard: function(){
    return Session.get('addingNewCreditCard');
  }

});

Template.creditCard.events({

  'click .add-new-card': function(){
    Session.set('addingNewCreditCard', true);
  }

});
