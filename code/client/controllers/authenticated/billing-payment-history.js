Template.billingPaymentHistory.helpers({
  hasInvoices: function(){
    var user        = Meteor.userId(),
        getInvoices = Invoices.find({"owner": user},{fields: {"_id": 1, "owner": 1}}).fetch();
    return getInvoices.length > 0 ? true : false;    
  },

  invoices: function(){
    var user        = Meteor.userId(),
        getInvoices = Invoices.find({"owner": user},{sort: {"date": -1}});

    if (getInvoices){
      return getInvoices;
    }
  }
});
