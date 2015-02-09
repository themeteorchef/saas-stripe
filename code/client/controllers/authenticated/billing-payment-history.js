Template.billingPaymentHistory.helpers({
  invoices: function(){
    var user        = Meteor.userId(),
        getInvoices = Invoices.find({"owner": user},{sort: {"date": -1}});

    if (getInvoices){
      return getInvoices;
    }
  }
});
