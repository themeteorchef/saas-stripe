/*
* Publications: Invoices
* Publish data from the Invoices collection.
*/

// userInvoices
Meteor.publish('userInvoices', function(){
  // Publish only the invoices for the current user. We can make use of this.userId
  // in our publication to get the user's ID. If we find invoices for the user,
  // publish them to the client.
  var user        = this.userId,
      getInvoices = Invoices.find({"owner": user}, {fields: {"email": 0}});

  if (getInvoices){
    return getInvoices;
  }
});

// viewInvoice
Meteor.publish('viewInvoice', function(invoiceId){
  // Publish only the invoice for the ID passed in our argument. We also make sure
  // to check our argument for validity.
  check(invoiceId, String);

  var user        = this.userId,
      getInvoice = Invoices.find({"_id": invoiceId, "owner": user});

  if (getInvoice){
    return getInvoice;
  }
});
