/*
* Routes: Authenticated
* Routes that are only visible to authenticated users.
*/

Router.route('todoLists', {
  path: '/lists',
  template: 'todoLists',
  onBeforeAction: function(){
    Session.set('currentRoute', 'lists');
    this.next();
  }
});

Router.route('todoList', {
  path: '/lists/:_id',
  template: 'todoList',
  onBeforeAction: function(){
    Session.set('currentRoute', 'todoLists');
    this.next();
  }
});

Router.route('billing', {
  path: '/billing',
  template: 'billing',
  onBeforeAction: function(){
    Session.set('currentRoute', 'billing');
    this.next();
  }
});

Router.route('billingPlan', {
  path: '/billing/plan',
  template: 'billingPlan',
  onBeforeAction: function(){
    Session.set('currentRoute', 'billing');
    this.next();
  }
});

Router.route('billingCard', {
  path: '/billing/card',
  template: 'billingCard',
  onBeforeAction: function(){
    Session.set('currentRoute', 'billing');
    this.next();
  }
});

Router.route('billingInvoice', {
  path: '/billing/invoice/:_id',
  template: 'billingInvoice',
  onBeforeAction: function(){
    Session.set('currentRoute', 'billing');
    this.next();
  }
});
