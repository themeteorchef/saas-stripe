### Getting Started
To get up and running in part two, we only need to include one additional package to our existing repository that we set up in [part one](http://themeteorchef.com/recipes/building-a-saas-with-meteor-stripe-part-1).

<p class="block-header">Terminal</p>

```.lang-bash
meteor add themeteorchef:bert
```
Because we'll be doing a bit of work in the UI, we'll use [themeteorchef:bert](http://atmospherejs.com/themeteorchef/bert) package to give us access to some spiffy alerts. This package will help us display feedback to customers when they perform an action in the app.

<div class="note">
  <h3>A quick note</h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed above are merely additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base#packages-included">Packages Included</a> list for Base to ensure you have fulfilled all of the dependencies. Additional packages used for this recipe can be found in the "Getting Started" section of <a href="http://themeteorchef.com/recipes/building-a-saas-with-meteor-stripe-part-1">part one</a> of this recipe.</p>  
</div>

### Starting the Server
Don't forget that because we added a settings file `settings.json` [during part 1](http://themeteorchef.com/recipes/building-a-saas-with-meteor-stripe-part-1), we need to start up our server with the command `meteor --settings settings.json`. Again, this command tells Meteor about our settings file. Without this, we'll see errors about Meteor not being able to locate our Stripe token.

### Changing Plans
When we left off in part one, we were focused on wiring up the customer's plan information to the billing overview page. With all of our static data in place, now we need to focus on making things a bit more dynamic. To get started, we need to make it possible for our customers to change their current plan.

Over on the `/billing/plan` page, we've got a template setup that pulls in the list of plans we defined in `settings.json` during part one. Let's take a look at the markup for the template and then see how we wire up the code to make it work.

<p class="block-header">/client/authenticated/billing/billing-plan.html</p>

```.lang-markup
<template name="billingPlan">
  [...]
  <ul class="list-group">
    {{#each plans}}
      <li class="list-group-item {{#if equals plan.subscription.plan.name name}}list-group-item-success{{/if}} bm-block clearfix">
        <div class="bm-block-content plan">
          <span class="plan-name-quota"><strong>{{capitalize name}}</strong> &mdash; {{limitString limit}}</span>
        </div>
        {{#if equals plan.subscription.plan.name name}}
          <button type="button" disabled="disabled" class="btn btn-success pull-right">Current Plan</button>
        {{else}}
          {{#if upgradeAvailable amount.cents}}
            <button type="button" data-loading-text="Upgrading..." class="btn btn-default pull-right downgrade-upgrade">Upgrade</button>
          {{else}}
            {{#if downgradeAvailable limit}}
              <button type="button" data-loading-text="Downgrading..." class="btn btn-default pull-right downgrade-upgrade">Downgrade</button>
            {{else}}
              <button type="button" disabled="disabled" class="btn btn-default pull-right downgrade-unavailable">Downgrade Unavailable</button>
            {{/if}}
          {{/if}}
        {{/if}}
      </li>
    {{/each}}
  </ul>
  [...]
</template>
```

Okay, so, there's quite a bit going on here. Let's focus on the `{{#each plans}}` part. Here, we're simply telling our template for each plan returned to our helper (this is the array on plans in `settings.json`—we'll cover wiring this up soon), we want to output a list item. Inside of that list item, we grab the name of the current plan and then we get into some sticky logic. What the heck is this?

To make things a bit easier on our customers, we want to give them a bit of [affordance](http://en.wikipedia.org/wiki/Affordance) as to _what_ plans they can change to and the impact that will have on their account. We break this into two parts by using the handlebar's `{{#if}}` helper in combination with our own `{{equals}}` helper.

Recall that in part one, we create a UI helper called `{{plan}}` that returns the current customer's plan information. Here, we access that, comparing the value of the customer's current plan name (e.g. "small") with the name of the plan currently being iterated in our `{{#each}}` block. Recall that our `{{equals}}` helper is setup to compare the first and second values we pass to it for equality. If they _are_ the same, we return a single button to our interface that's disabled and labeled with "Current Plan."

In the `{{else}}` portion of our block, we take a slightly different approach. Because we know that our each block contains the plans that our customer is _not_ subscribed to, we want to help them differentiate between which plans would be an [_upgrade_](https://www.youtube.com/watch?v=kPXcvThRNBI) and which would be a _downgrade_. In order to understand how this actually works, let's hop over to our controller code for this template.

<p class="block-header">/client/controllers/authenticated/billing-plan.js</p>

```.lang-javascript
Template.billingPlan.helpers({
  plans: function(){
    var getPlans = Meteor.settings.public.plans;
    if (getPlans) {
      return getPlans;
    }
  }
  [...]
});
```

Before we dig into our upgrade and downgrade logic, let's make a quick nod to how we're actually getting our list of plans. Recall that because we've stored our plans in `settings.json` we can access them in our helper by calling `Meteor.settings.public.plans`. Because we've stored this information as an array, it's all ready to go for our `{{#each}}` helper. Nice!

#### Upgrading & Downgrading

<p class="block-header">/client/controllers/authenticated/billing-plan.js</p>

```.lang-javascript
upgradeAvailable: function(iteratedPlanAmount){
  var currentUser = Meteor.userId();
  var getPlan     = Session.get('getUserPlan_' + currentUser);

  Meteor.call('checkUserPlan', currentUser, function(error, response){
    if ( error ) {
      console.log(error);
    } else {
      Session.set('getUserPlan_' + currentUser, response);
    }
  });

  if (getPlan){
    var currentPlanAmount = parseInt( getPlan.amount.replace("$", "") ) * 100;
    return currentPlanAmount < iteratedPlanAmount ? true : false;
  }
},
```

Our `upgradeAvailable` and `downgradeAvailable` helpers are a _bit_ more complicated. Above we can see the `upgradeAvailable` helper mapped out. This may look a little familiar. Just like our UI helper `{{plan}}`, we're calling to our server-side method `checkUserPlan` to get the current customer's plan data. This is almost identical to what we've done in our helper, except that when we return our plan data, we do a quick comparison first.

Notice that in our helper declaration, we're passing an argument called `iteratedPlanAmount`. This value corresponds to the `amount.cents` value seen in our `{{#if}}` block `{{#if upgradeAvailable amount.cents}}`. The cool part is that `amount.cents` is given to us by our `{{#each}}` block. In other words, this value is equal to the _current plan being looped_. Crazy, right? To make things easy, we just pass this value to our helper so we can make use of it in our logic.

At the bottom of our helper definition, we set a variable `currentPlanAmount` equal to the value of the customer's current plan amount retrieved from the server (with a bit of conversion from a string with a prefixed "$" into an integer). Using a ternary operator, we check to see whether the user's current plan amount is _less than_ the current plan being iterated in our `{{#each}}` block. If it is, we return `true` meaning that "the plan we're on costs less than the one being looped, so the plan being looped is an upgrade from what we have now." Make sense? Back over in our template real quick, we can see the result of this:

<p class="block-header">/client/authenticated/billing/billing-plan.html</p>

```.lang-markup
{{#if upgradeAvailable amount.cents}}
  <button type="button" data-loading-text="Upgrading..." class="btn btn-default pull-right downgrade-upgrade">Upgrade</button>
{{else}}
```

Cool! If our logic determines that a plan is an "upgrade" option, it returns the correct button for the customer. Now when they look at the list of plan options, they'll know exactly which plans are a step up, or a step down! Just to make sure this is all clear, let's take a look at the logic for the `downgradeAvailable` helper.

<p class="block-header">/client/controllers/authenticated/billing-plan.js</p>

```.lang-javascript
Template.billingPlan.helpers({
  [...]
  downgradeAvailable: function(limit){
    var currentUser = Meteor.userId();
    var getPlan     = Session.get('getUserPlan_' + currentUser);
    if (getPlan){
      var used = getPlan.subscription.plan.used;
      return used <= limit ? true : false;
    }
  }
});
```

Hold up! Shouldn't this be almost identical to the `upgradeAvailable` helper? Almost. Notice that here instead of looking at _price_ we're looking at the number of todo lists the customer has used up vs. the number of lists that come with each plan. Why is that? Consider this: if a user starts out with the "Large" plan (20 lists) and uses up 15 of those 20 lists, we wouldn't want them to be able to downgrade to the "Medium" plan (10 lists). Why not? This would mean that the user received 5 todo lists for free. [Oh _hell_ no](https://www.youtube.com/watch?v=im_5QdHp04E). So how do we stop it?

Notice that we're using the same trick as before by passing over the currently looped plan's `limit` as an argument to our helper. Next, we piggyback on our `getUserPlan_` Session helper to get our user's current plan information. Wait...how does that work? This works because we're already setting the value of our `getUserPlan_` Session helper in our `upgradeAvailable` helper. This works because both of our template helpers are being called on render. As a result, the value of `Session.get('getUserPlan_' + currentUser)` is accessible to both without jumping through hoops. Neat!

Now, we just need to look at how many lists the customer has currently used and decided whether or not that value is _less than or equal to_ our currently looped plan. If it _is_ less than or equal to, we enable the downgrade option. If it's _not_ we disable it. Now we can guarantee that a user can't change to a plan and keep extra lists in tow.

<div class="note">
  <h3>A quick note</h3>
  <p>This could present a tiny UX snafu. In our demo, we're not providing any feedback to the customer as to <em>why</em> the downgrade option is blocked. Ideally, you could add a tooltip to the button, or leave the button clickable displaying a "warning" message instead if they try to downgrade. It's not 100% necessary, but when it comes to handling money for your customers: make sure the UX is tight.</p>
</div>

#### Handling the Plan Change
Okay, so our UI is looking solid, but now we actually need to make our options _do_ something. This is really easy and also really cool. Let's take a look.

<p class="block-header">/client/controllers/authenticated/billing-plan.js</p>

```.lang-javascript
Template.billingPlan.events({
  'click .downgrade-upgrade': function(e){
    var plan = this.name;
    var downgradeUpgradeButton = $(e.target).button('loading');
    var confirmPlanChange = confirm("Are you sure you want to change your plan?");
    if (confirmPlanChange){
      Meteor.call('stripeUpdateSubscription', plan, function(error, response){
        if (error){
          downgradeUpgradeButton.button('reset');
          Bert.alert(error.reason, "danger");
        } else {
          if (response && response.error){
            Bert.alert(response.error.message, "danger");
          } else {
            downgradeUpgradeButton.button('reset');
            Session.set('currentUserPlan_' + Meteor.userId(), null);
            Bert.alert("Subscription successfully updated!", "success");
          }
        }
      });
    } else {
      downgradeUpgradeButton.button('reset');
    }
  }
});
```

Nothing too crazy. We've wired up a click event that looks at each of our buttons (denoted by the `.downgrade-upgrade` class), and gets the name of the plan. Hmm, that seems odd...what's with the `this.name` thingy? This is a nice bonus that Meteor (and our `{{#each}}` helper) gives us. Whenever we're in a block context, Meteor gives us access to the _currently looped item_ via `this`. With `this`, we can grab any value from the item we want. All of the logic is handled for us so we can just focus on what we need to. Woah!

What this affords us, here, is the ability to look at which plan the button was clicked from within and return the name. Once we've got it, we do a quick `confirm()` dialog to make sure the user intended to do this. If they answer in the positive, we call to a method on the server `stripeUpdateSubscription` to process the change. Let's jump up to the server quick to see what this method is doing.

<p class="block-header">/server/methods/stripe.js</p>

```.lang-javascript
stripeUpdateSubscription: function(plan){
  check(plan, String);

  var stripeUpdateSubscription = new Future();

  var user    = Meteor.userId();
  var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

  Stripe.customers.updateSubscription(getUser.customerId, {
    plan: plan
  }, function(error, subscription){
    if (error) {
      stripeUpdateSubscription.return(error);
    } else {
      Fiber(function(){
        var update = {
          auth: SERVER_AUTH_TOKEN,
          user: user,
          plan: plan,
          status: subscription.status,
          date: subscription.current_period_end
        }
        Meteor.call('updateUserPlan', update, function(error, response){
          if (error){
            stripeUpdateSubscription.return(error);
          } else {
            stripeUpdateSubscription.return(response);
          }
        });
      }).run();
    }
  });

  return stripeUpdateSubscription.wait();
},
```

Quite a few moving parts here, but nothing to be panicked about. Let's step through it.

First, we do a `check()` on the `plan` argument we passed (remember, this is equal to the `this.name` value we pulled from our template). Next, we set up a `Future()` so that we can return the value Stripe gives us once it's ready. Keep in mind, we're doing this because Stripe's API is being called _asynchronously_ meaning unless we tell our method to wait for it to finish, we won't get a return value. Before we go any further, we should talk about `Meteor.wrapAsync()`.

<div class="note">
  <h3>A quick note</h3>
  <p>It was mentioned in the comments for part one of this recipe over on <a href="http://crater.io/posts/7xmPagxuQjwMqZzcY">crater.io</a> by Arunoda from <a href="http://meteorhacks.com">Meteor Hacks</a> that instead of all this Future stuff, we could just use `Meteor.wrapAsync`. He's right. There's a good reason I _haven't_ used it here and that has to do with comprehension. This is opinionated, but I've found the syntax of `Meteor.wrapAsync()` to be a bit confusing.</p>
  <p>After tinkering with the code above, I found that it was much easier to explain what was happening using the Future's pattern. I should note that _neither_ option is wrong. While I can't speak on performance, I'd imagine that with the little bit of clarity you gain from using a Future, you lose a tiny bit of performance. This is entirely, speculative, though, and I'd encourage you trying out both patterns in your own application(s) before putting a stake in the ground. Use what fits best!</p>
</div>

Alright, moving on. Next, we need to do a quick lookup on our user so we can get Stripe their `customerId`. Remember that we're not publishing this to the client, so we need to remember to pull it in here. Once we have it, we call to `Stripe.customers.updateSubscrtipion()` passing our customer's `customerId`. Because we're just updating their plan, we only need to specify one parameter, `plan`, and set it equal to our `plan` argument passed from our template.

Things get a little sticker when we get into updating our user's plan in our _local_ database.

<p class="block-header">/server/methods/stripe.js</p>

```.lang-javascript
Fiber(function(){
  var update = {
    auth: SERVER_AUTH_TOKEN,
    user: user,
    plan: plan,
    status: subscription.status,
    date: subscription.current_period_end
  }
  Meteor.call('updateUserPlan', update, function(error, response){
    if (error){
      stripeUpdateSubscription.return(error);
    } else {
      stripeUpdateSubscription.return(response);
    }
  });
}).run();
```

Because we're running Meteor code in the callback of another function, Meteor will require it to run within a `Fiber`. Why? Once we're in the callback of another function, the original Meteor environment (outside of the callback we're in) is no longer available. This means that Meteor cannot "see" things like `Meteor.userId()` or call to methods. Wrapping everything in a `Fiber(function(){}).run()` call helps us get around that.

Inside of our Fiber, we call to `updateUserPlan`, passing our update object we've defined above it. Notice that here, we're making use of the `SERVER_AUTH_TOKEN` pattern from [part one](http://themeteorchef.com/recipes/building-a-saas-with-meteor-stripe-part-1) again. We're also pulling in some data that we've received in the `subscription` argument from Stripe. Let's jump over to see what this method is doing.

<p class="block-header">/server/methods/data/update/user.js</p>

```.lang-javascript
updateUserSubscription: function(update){
  check(update, {auth: String, user: String, subscription: {status: String, ends: Number}});

  var updateUserSubscription = new Future();

  if ( update.auth == SERVER_AUTH_TOKEN ){
    Meteor.users.update(update.user, {
      $set: {
        "subscription.status": update.subscription.status,
        "subscription.ends": update.subscription.ends
      }
    }, function(error, response){
      if (error) {
        updateUserSubscription.return(error);
      } else {
        updateUserSubscription.return(response);
      }
    });
  } else {
    throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
  }

  return updateUserSubscription.wait();
}
```

Look familliar? Just like we did in part one, we're wrapping the meat of our method in a check for `SERVER_AUTH_TOKEN`. Once we're sure we're on the server, we just call to `Meteor.users.update`, passing our user's `id`. Easy peasy. Our update is simply the values we passed over to our method from within our `Stripe.customers.updateSubscription` callback. It's a bit Inception-y, but you can sort of think of it like hot potato. Each of our methods is just tossing the potato (our call from the client side) until it gets a response (or an error). Once our user is updated, we simply return our `updateUserSubscription` Future we've defined here _back to_ our `stripeUpdateSubscription` method to ultimately return to the client.

So let's pause for a second. What does all of this actually _achieve_? Two things: it ensures that our customer's subscription has been updated _on Stripe's servers_, but also that their subscription has been updated on _our servers_. We do this "twice" because it allows us to store some knowledge of our customers current "state" locally. We could alternatively just call to Stripe every time we wanted this information, but that could get pretty costly. It also means Stripe needs to be working no matter what, or we risk breaking our application. This may seem like a lot of work, but it's all in service of a bigger point: a great customer experience. Even though we're just lowly developers, we can [kick those design nerds in the shins](http://youtu.be/VZ2CSpNze5Q?t=10s) with little gems like this.

Okay. Before we call this part complete, let's head back over to the client to see what we do when our response finally makes it _back to_ the client.

<p class="block-header">/client/controllers/authenticated/billing-plan.js</p>

```.lang-javascript
Meteor.call('stripeUpdateSubscription', plan, function(error, response){
  if (error){
    downgradeUpgradeButton.button('reset');
    Bert.alert(error.reason, "danger");
  } else {
    if (response && response.error){
      downgradeUpgradeButton.button('reset');
      Bert.alert(response.error.message, "danger");
    } else {
      downgradeUpgradeButton.button('reset');
      Session.set('currentUserPlan_' + Meteor.userId(), null);
      Bert.alert("Subscription successfully updated!", "success");
    }
  }
});
```

Not this again! Yep. Sorry. Because we can't be 100% certain that Stripe's response will be in the _positive_, we need to check the `response` argument in our method's callback. First, we make sure there's not an error from our method itself (e.g. "method is not defined"). Next, if we get a response (meaning Stripe is sending us something) we need to check to see if it has an `error` object defined and if not, to update our UI. There's a few things to pay attention to here. First, whether there's an error or not, we're resetting our button's state.

We're also introducing an alert by using the `themeteorchef:bert` package we installed earlier. Depending on whether we get an error or our method is successful, we tell `Bert` which message style to use (errors are marked as `'danger'` to display alerts in red and successes are marked in green with `'success'`). Now, when something happens, good or bad, we can let the user know to help in their decision process. We're also doing something odd here. Why are we setting our `currentUserPlan_` Session variable to equal `null`?

[Witchcraft](http://youtu.be/XfdiXBA7f6U?t=1m16s)! No. Not at all. But this is neat. Recall that we're making use of our `{{plan}}` UI helper to select our user's current plan. While handy for obscuring the user's plan data from the client, it actually catches us off guard a bit by _not_ being reactive. Think about it: we're calling to a method on the server which by itself isn't reactive. We do know, though, that our helper is dependent on our Session variable `currentUserPlan_` which _is_ reactive. By toggling this to `null` when our method call is successful, we're forcing our UI helper to update itself. This means that the UI will correctly update to reflect the user's new plan selection. Wacky.

All right, that knocks out this feature. Our customers can know change their plan and be notified immediately of the change on screen. Awesome!

Next, we'll focus on updating a credit card. This one is interesting.

### Adding and Updating Credit Cards
Since we last saw it in part one, our credit card template has grown up a bit. Because our goal is to reuse our template in a handful of different situations, we needed to beef it up a bit to be context-aware. This means that our template knows _where_ it is being invoked and can manage its own state accordingly. How does that work?

Introduced in Meteor 0.8.2, [dynamic templates](http://docs.meteor.com/#/full/template_dynamic) allow us to:

> [...] include a template by name, where the name may be calculated by a helper and may change reactively. <br>

&mdash; via [Meteor Template.dynamic Documentation](http://docs.meteor.com/#/full/template_dynamic)

In our case, we're not using these _quite_ this way. Instead, we're making use of the dynamic template's `data` context. So this makes sense, let's look at how we've included our credit card template into our `billingCard` template:

#### Refactoring the creditCard Template

<p class="block-header">/client/views/authenticated/billing/billing-card.html</p>

```.lang-markup
{{> Template.dynamic template="creditCard" data="billing-card"}}
```

So here, we're passing our template `creditCard` to our `template` parameter, and then as a string, we're specifying that our data context is `billing-card`. What exactly does this mean? Let's take a quick look at our helpers for our `creditCard` template to see what this does.

<p class="block-header">/client/controllers/authenticated/credit-card.js</p>

```.lang-javascript
Template.creditCard.helpers({
  isBilling: function(){
    var instance = Template.instance();
    if ( instance.data.search("billing") > -1 ) {
      return true;
    } else {
      return false;
    }
  },
  isBillingCard: function(state){
    var instance = Template.instance();
    if (instance.data == "billing-card") {
      return true;
    } else {
      return false;
    }
  },
  addNewCard: function(){
    return Session.get('addingNewCreditCard');
  }
});
```

A few things going on here. First, our `isBilling` helper helps us to find out if our `creditCard` template is appearing in one of our billing views (`/billing/card` or `/billing/resubscribe` which we'll cover in a bit). To find out, we simply look the returned value of `Template.instance().data` (this is equivalent to the string we've passed to our dynamic template include in the `data` parameter) and use the JavaScript `.search()` method to see if it includes the word "billing." If it does (denoted by the return value being greater than `-1`), we return `true`. If it's not, we return `false`. Let's look at how this appears in the `creditCard` template:

<p class="block-header">/client/views/global/credit-card.html</p>

```.lang-markup
{{#if isBilling}}
  {{#if addNewCard}}
    <input type="text" data-stripe="cardNumber" class="form-control card-number" placeholder="Card Number">
    <p><a class="cancel-new-card" href="#">Cancel</a></p>
  {{else}}
    {{#if plan.subscription.payment.card}}
      <p class="alert alert-info">Card on File: <strong>{{plan.subscription.payment.card.type}}</strong> &mdash; {{plan.subscription.payment.card.lastFour}}</p>
      <p><a class="add-new-card" href="#">Add a New Card</a></p>
    {{/if}}
  {{/if}}
{{else}}
  <input type="text" data-stripe="cardNumber" class="form-control card-number" placeholder="Card Number">
{{/if}}
[...]
{{#if isBilling}}
  {{#if isBillingCard}}
    {{>creditCardDetails}}
  {{else}}
    {{#if addNewCard}}
      {{>creditCardDetails}}
    {{/if}}
  {{/if}}
{{else}}
  {{>creditCardDetails}}
{{/if}}
```

What we're looking to accomplish here is to decide when our credit card form should display some additional items with it. When we're not in a billing view (e.g. on the `/signup` page), we just want to display our form as-is. In the billing views, though, we need to account for displaying whether or not the customer has a credit card on file with us. The `isBilling` check allows us to separate these two states accordingly.

That's not all, though. We also have two other helpers: `isBillingCard` and `addNewCard`. The first, `isBillingCard` does what you might expect and lets us know if we're on the `billingCard` template (this time matching the `data` context passed to our template include specifically to the string `"billing-card"`). In our template, we can see this is used to target the visibility of our `creditCardDetails` template (the expiration month/year and CVC fields).

Our last helper, here, `addNewCard` is also used to toggle state. We simply check our `addingNewCreditCard` Session variable and return it (it will be either `true`, `false`, or `null`). This just decides whether or not we should display our credit card form with a "Add a New Card," or "Cancel" link below it. Ultimately, this lets our customer change their mind between adding a new card and using their existing one. We won't jump to it here, but if we look at our event map for the `creditCard` template, we can see how clicking these links changes the value of our `addingNewCreditCard` Session variable.

<div class="note">
  <h3>A quick note</h3>
  <p>This may all be a bit confusing. I'll admit, I was hung up on this for a bit as I tried to figure out how to get everything to work together. While reusing templates as much as possible is ideal, as you can see, in some situations it can get pretty hairy. When in doubt, don't be afraid to duplicate a template if it means less-spidery code. Reusing templates is <em>ideal</em>, but the <a href="https://www.meteor.com/people">Meteor Development Group</a> isn't going to show up screaming at your door with guns if you don't.</p>
</div>

#### Adding a New Card

Let's look at our controller for updating or adding a new credit card. This one is sort of a doozie because we're looking to determine whether the customer is _updating_ their existing card, or _adding_ a new card entirely. Our focus will be on the `submit form` event handler in our `events` callback of our `billingCard` template.

<p class="block-header">/client/controllers/authenticated/billing-card.js</p>

```.lang-javascript
Template.billingCard.events({
  'submit form': function( e ){
    e.preventDefault();

    var currentUser      = Meteor.userId();
    var updateCardButton = $(".update-card").button('loading');

    var newCard = Session.get('addingNewCreditCard');
    if (newCard){
      STRIPE.getToken( '#billing-card', {
        number: $('[data-stripe="cardNumber"]').val(),
        exp_month: $('[data-stripe="expMo"]').val(),
        exp_year: $('[data-stripe="expYr"]').val(),
        cvc: $('[data-stripe="cvc"]').val()
      }, function() {
        var token = $( "#billing-card [name='stripeToken']" ).val();

        Meteor.call('stripeSwapCard', token, function(error, response){
          if (error){
            Bert.alert(error.reason.message, 'danger');
            updateCardButton.button('reset');
          } else {
            if (response.rawType !== undefined && response.rawType == "card_error"){
              Bert.alert(response.message, "danger");
              updateCardButton.button('reset');
            } else {
              updateCardButton.button('reset');
              Session.set('currentUserPlan_' + currentUser, null);
              Session.set('addingNewCreditCard', false);
              Bert.alert("New card successfully added!", "success");
            }
          }
        });
      });
    } else {
      [...]
    }
  }
});
```

This should look somewhat familiar. Just like with our signup template in part one, we're calling a few methods. The difference this time, is that we're looking at our `addingNewCreditCard` Session variable to determine _which_ method to call. Here, we're looking at our first method call `stripeSwapCard` that will be used when the customer is adding a new card. Let's jump up to the server to see this fella in action.

<p class="block-header">/server/methods/stripe.js</p>

```.lang-javascript
stripeSwapCard: function(token){
  check(token, String);

  var stripeSwapCard = new Future();

  var user    = Meteor.userId();
  var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

  Stripe.customers.update(getUser.customerId, {
    source: token
  }, function(error, customer){
    if (error) {
      stripeSwapCard.return(error);
    } else {
      var card = {
        lastFour: customer.sources.data[0].last4,
        type: customer.sources.data[0].brand
      }
      Fiber(function(){
        var update = {
          auth: SERVER_AUTH_TOKEN,
          user: user,
          card: card
        }

        Meteor.call('updateUserCard', update, function(error, response){
          if (error){
            stripeSwapCard.return(error);
          } else {
            stripeSwapCard.return(response);
          }
        });
      }).run();
    }
  });
}
```

This pattern should look pretty familiar by now. Here, we do a quick `check()` on the structure of our `card` argument and then setup a `Future()` to get our return value from Stripe (and subsequently our `updateUserCard` method). Just like in our `stripeUpdateSubscription` method, here, we grab data from our callback's response argument (here this is `customer`), grab some data from it, and then pass it over to _another_ method (wrapped in a `Fiber()`) to update our customer's card. The same thing applies as before: we 1.) perform the update on Stripe, and 2.) insert the confirmation into _our_ database via a method. Could we simplify this?

Yep! There's a good reason for keeping this verbose. It's important to understand _how_ the data is moving through Stripe and into our database. We could tackle this pattern with a number of different solutions (e.g. skipping method calls and using plain server-side functions). By doing it this way in the demo, though, we can see each explicit step taken to produce the end result we want. Integrating third-party systems like Stripe, while easier than some concepts, can still introduce a lot of repetitive patterns. The challenge for you is to apply your programming knowledge to refactor code like this to be more performant or fitting for your application.

We're going to skip following the trail over to the `updateUserCard` method and instead hop back to the client assuming we've received a positive response.

<p class="block-header">/client/controllers/authenticated/billing-card.js</p>

```.lang-javascript
if (error){
  Bert.alert(error.reason.message, 'danger');
  updateCardButton.button('reset');
} else {
  if (response.rawType != undefined && response.rawType == "card_error"){
    Bert.alert(response.message, "danger");
    updateCardButton.button('reset');
  } else {
    updateCardButton.button('reset');
    Session.set('currentUserPlan_' + currentUser, null);
    Session.set('addingNewCreditCard', false);
    Bert.alert("New card successfully added!", "success");
  }
}
```

Back on the client, we need to handle what happens in the callback of our `stripeSwapCard` method. Again, we need to handle our errors for both the method failing as well as checking our `response` argument to see if there's an error. But wait! What the heck is `rawType`? This is done because when Stripe reports a `card_error`, they don't return the standard `error` object that we've grown familiar with in our other API calls.

With that in mind, we make use of our `Bert.alert()` method again, handling either the error or success state as necessary. Notice, too, that we're resetting our Session variables once again to achieve the same results as before (toggling reactivity on our plan data). Making sense? Great! Now...how about _updating_ an existing credit card?

#### Updating a Credit Card
Recall that we've set up our `creditCard` template to display whether or not the customer has an existing card "on file." When this is the case, Stripe allows us to update the "Expiration Month" and "Expiration Year" values on the card. If you look at our demo, you can see that our `creditCard` template is already accounting for this on the `/billing/card` page. Nifty! Since we've already gone over toggling UI state in our template, let's look at the other half of our `billingCard` template's `submitHandler` callback.

<p class="block-header">/client/controllers/authenticated/billing-card.js</p>

```.lang-javascript
var newCard = Session.get('addingNewCreditCard');
if (newCard){
  [...]
} else {
  var updates = {
    exp_month: $('[name="expMo"]').val(),
    exp_year: $('[name="expYr"]').val()
  }
  Meteor.call('stripeUpdateCard', updates, function(error, response){
    if (error){
      Bert.alert(error.reason, "danger");
      updateCardButton.button('reset');
    } else {
      if (response.rawType != undefined && response.rawType == "card_error"){
        Bert.alert(response.message, "danger");
        updateCardButton.button('reset');
      } else {
        updateCardButton.button('reset');
        $('#billing-card')[0].reset();
        Session.set('currentUserPlan_' + currentUser, null);
        Bert.alert("Credit card successfully updated!", "success");
      }
    }
  });
}
```

Just like adding a new card! But with one twist. Instead of calling to `stripeSwapCard`, here, we're actually calling to `stripeUpdateCard`. The good news? This method is more or less identical to our `stripeSwapCard` method in terms of behavior. The only difference being that we're passing different data to be updated and calling a different Stripe API method (`Stripe.customers.updateCard`). We're also doing something else unique due to the requirements of `stripe.customers.updateCard`. Let's hop up to the server quick and check it out.

<p class="block-header">/server/methods/stripe.js</p>

```.lang-javascript
stripeUpdateCard: function(updates){
  [...]
  Meteor.call('stripeRetrieveCustomer', getUser.customerId, function(error, response){
    if (error){
      stripeUpdateCard.return(error);
    } else {
      var card = response.cards.data[0].id;
      Stripe.customers.updateCard(getUser.customerId, card, updates, function(error, customer){
        if (error) {
          stripeUpdateCard.return(error);
        } else {
          stripeUpdateCard.return(customer);
        }
      });
    }
  });
```

Because Stripe's `updateCard` method requires not only a `customerId` but also a _cardId_, we need to retrieve it first _before_ we update the card. It's important to note that this isn't 100% necessary. In reality, we could have stored the ID of customer's current credit card in our database. There's nothing wrong with this, it was just more or less an oversight.

If you want to save yourself an extra API call, it's worth exploring storing the `cardId` (again, this isn't the card number itself but a unique identifier Stripe uses to _reference_ the card) in your own database. The rest of this is what you expect: hop over to the `stripeRetrieveCustomer` method, snag the `cardId`, and then pass it back to our call to `Stripe.customers.updateCard` method. Boom! Once this completes your customers card will be updated. Back on the client, we'll fire an alert message via `Bert` to let them know all is well and toggle reactivity on our `{{plan}}` helper by setting `currentUserPlan_` to `null`.

### Subscription Status
Okay, so, we've got some important functionality wired up to help our customer better control the state of their account. But we've left something out...actually _displaying_ the account state. Next, we'll learn how to manage the customer's subscription status and help them to understand the current state of their account.

#### Displaying Status
The first thing we need to do is to actually display the customer's account status. [Duh](http://media.giphy.com/media/Lndtxw3ztLhNC/giphy.gif). Let's take a look at a little addition we've made to the `billingOverview` template to get this done.

<p class="block-header">/client/views/authenticated/billing/billing-overview.html</p>

```.lang-markup
<template name="billingOverview">
  [...]
    <div class="panel-body">
      <ul class="list-group">
        {{#if equals plan.subscription.status "trialing"}}
          <li class="list-group-item list-group-item-info">
            <p>You're trialing Todoodle until {{epochToString plan.subscription.ends}}. <a href="#" class="cancel-subscription">Cancel Subscription</a>.</p>
          </li>
        {{/if}}
        {{#if equals plan.subscription.status "active"}}
        <li class="list-group-item list-group-item-success">
          <p>Your subscription is currently active! <a href="#" class="cancel-subscription">Cancel</a>.</p>
        </li>
        {{/if}}
        {{#if equals plan.subscription.status "canceled"}}
        <li class="list-group-item list-group-item-danger">
          <p>Your subscription will end on {{epochToString plan.subscription.ends}}. Change of heart? <a href="{{pathFor 'billingResubscribe'}}">Resubscribe</a>.</p>
        </li>
        {{/if}}
        [...]
      </ul>
    </div>
  [...]
</template>
```

Oh yeah, code reusability! Look at our `{{plan}}` UI helper [shine](http://media.giphy.com/media/2UpzC3iPenf44/giphy.gif). Can you see what's happening here? It's actually quite beautiful. Using a combination of our `{{equals}}` helper along with an `{{#if}}` block, we're simply checking to see whether the value of the current customer's subscription status is equal to the string we've specified: `trialing`, `active`, or `canceled`.

Depending on the state, we prepend our list of plan data in `billingOverview` with a colored bar to match the state (green for `active`, yellow for `trialing`, and red for `canceled`). We also include an option to _cancel_ their subscription or resubscribe depending on the current state. Woah!

<div class="note">
  <h3>A quick note</h3>
  <p>It should be noted that subscriptions in Stripe actually have <a href="https://stripe.com/docs/api#subscription_object">five states they can take on</a>: trialing, active, past_due, canceled, and unpaid. We've left out past_due and unpaid here as those are fringe scenarios. Keep in mind, though, supporting these two additional states follows the same pattern as we're describing here. If you need help with this, don't hesitate to get in touch: <a href="mailto:help@themeteorchef.com">help@themeteorchef.com</a>.</p>
</div>

Now that we have this in place, let's focus on implementing the cancellation feature (don't cry) so that our customers can have full control over their account. Unless you're a total jerk and looking to scam your customers and/or make their lives difficult. If so, [right this way](http://darkpatterns.org/). That's a joke. I'm not telling you to do that. Now that we've cleared that up...to the gallows!

#### Canceling a Subscription
This is actually one of the easiest parts of our Stripe implementation. To make this work, we just need to add a click event to each of the "Cancel" links that we've displayed contextually in our subscription status bar. Let's take a look at the controller for this:

<p class="block-header">/client/controllers/authenticated/billing-overview.js</p>

```.lang-javascript
Template.billingOverview.events({
  'click .cancel-subscription': function(){
    var confirmCancel = confirm("Are you sure you want to cancel? This means your subscription will no longer be active and your account will be disabled on the cancellation date. If you'd like, you can resubscribe later.");
    if (confirmCancel){
      Meteor.call('stripeCancelSubscription', function(error, response){
        if (error){
          Bert.alert(error.reason, "danger");
        } else {
          if (response.error){
            Bert.alert(response.error.message, "danger");
          } else {
            Session.set('currentUserPlan_' + Meteor.userId(), null);
            Bert.alert("Subscription successfully canceled!", "success");
          }
        }
      });
    }
  }
});
```

Pretty straightforward. On click, we ask the customer to confirm their choice. If it's in the positive, we zip up to the server and call `stripeCancelSubscription`. This is just as neat and tidy as you'd expect. We're going to skip over looking at the server method here, as it looks identical to our other Stripe API calls. Again, the pattern is to call to the Stripe API and once we've received a response, update our local database.

There _is_ something to note again, though. Just like earlier when we were updating our user's plan, we want to set `currentUserPlan_` to `null` on success. Again, this helps us to gain back reactivity on this data as our UI helper `{{plan}}` relies on a non-reactive Method call. Setting this to `null` forces our UI helper to rerun as our Session variable is reactive. Tricky.

So now that our user has canceled their subscription, what exactly does that _mean_ in our application? Let's take a look.

#### Controlling Unsubscribed State
We're showing the customer that their subscription has been canceled, but their account hasn't really changed at all. Ideally, we want to control their access to different areas of our application or prevent certain actions from being completed. To do this, we're going to have a little fun with [Iron Router's hooks](https://github.com/EventedMind/iron-router/blob/devel/Guide.md#hooks) to get the job done.

<p class="block-header">/client/routes/hooks.js</p>

```.lang-javascript
checkSubscription = function(){
  var user        = Meteor.userId(),
      userPlan    = Session.get("currentUserPlan_" + user);

  if (userPlan){
    var status      = userPlan.subscription.status,
        currentDate = ( new Date() ).getTime() / 1000,
        validDate   = userPlan.subscription.ends > currentDate;

    if ( status == "trialing" || status == "active" ) {
      this.next();
    } else if ( status == "canceled" && validDate ) {
      this.next();
    } else if ( status == "canceled" && !validDate ) {
      Router.go('/billing/resubscribe');
    } else {
      Router.go('/billing/resubscribe');
    }
  } else {
    this.next();
  }
}
[...]
Router.onBeforeAction(checkSubscription, {
  except: [
    'index',
    'signup',
    'login',
    'recover-password',
    'reset-password',
    'billing',
    'billingPlan',
    'billingCard',
    'billingInvoice',
    'billingResubscribe'
  ]
});
```

Isn't this cool?! Maybe you don't understand what's happening. Let's step through it. First, we should define what an Iron Router hook is...

> A hook is just a function. Hooks provide a way to plug into the process of running a route, typically to customize rendering behavior or perform some business logic.
>

via [Iron Router "Hooks" Documentation](https://github.com/EventedMind/iron-router/blob/devel/Guide.md#hooks)

Our function, then, is designed to check our current customer's subscription status as well as the date their plan is set to end. Based on what we learn, we tell Iron Router either to keep rendering our route, or, to redirect to our `/billing/resubscribe` page (we'll cover this next). This should be fairly clear, however, we should make note of how the dating part works. The reason we check this is that when our customer cancels their subscription, we tell Stripe to do so _at period end_.

In human speak, this means that although the customer's account has been marked as canceled, their subscription won't technically _end_ until the end of the current billing period (e.g. if I have a 30 day subscription and cancel on day 15, I still have 15 days left). Because we want our customers get the value they've paid for out of our app, we need to account for this fact. By checking the date in combination with the status, we can determine whether or not we've hit the _period end_ for their subscription, or if they're in the "canceled but not ended" window.

To run our hook, we simply call to Iron Router's `onBeforeAction` method, passing our `checkSubscription` function. We also pass an array of pages that we _don't_ want to run the hook (i.e. don't block the customer from viewing pages that will help them to get out of this block). Now, whenever Iron Router runs a route, it will hit this `onBeforeAction` and if we find the customer isn't subscribed, block them from the page they were trying to access. It's so [_evil_](http://youtu.be/3ld3imEfpZU?t=8s).

Make sense? Killer! Let's take a look at [roping our customer's back in](http://media.giphy.com/media/8fE7VzqdcXvOw/giphy.gif) after they've canceled their account.

#### Resubscribing to a Subscription
If you've signed up for any SaaS before, it's likely that you've used it heavily at one point, but then didn't need it so much later. You weren't saying bye for good, but you wanted to cancel your subscription for a little bit until you needed it again.

In order to do this in our own app, we've setup a route to a page called `/billing/resubscribe`. This page simply displays a form made up of two of our existing templates: `selectPlan` and `creditCard`. Let's take a quick look to see how it's laid out.

<p class="block-header">/client/views/authenticated/billing/billing-resubscribe.html</p>

```.lang-markup
<template name="billingResubscribe">
  <div class="row">
    <div class="col-xs-12 col-sm-6 col-md-5 col-lg-4 center-block" style="float: none;">
      <div class="panel panel-default billing-module">
        <div class="panel-heading">
          <h3 class="panel-title"><a href="{{pathFor 'billing'}}" class="text-muted">Billing</a> / Resubscribe</h3>
        </div>
        <form id="resubscribe">
          <div class="panel-body">
            <p class="alert alert-success">Looking to resubscribe to Todoodle? Awesome! We're excited to have you back. To flip the on switch for your account, go ahead and pick out a plan you'd like below. We'll also need your current credit card information. Keep in mind: <strong>this will charge your card immediately</strong>.</p>
            <div class="form-group">
              {{>selectPlan}}
            </div>
            {{> Template.dynamic template="creditCard" data="billing-resubscribe"}}
          </div> <!-- end .panel-body -->
          <div class="panel-footer">
            <button type="submit" class="btn btn-success resubscribe" data-loading-text="Resubscribing...">Resubscribe</button>
            <a href="{{pathFor 'billing'}}" class="btn btn-default">Cancel</a>
          </div>
        </form> <!-- end #resubscribe -->
      </div>
    </div> <!-- end .col-xs-12 -->
  </div> <!-- end .row -->
</template>
```

Pretty awesome, right? Nothing too complex, but it gives us an easy template to send the user to when they want to resubscribe. What's nice about this is that not only are customers redirected to this template once their subscription expires, they can also access it after they've canceled, but _before_ their plan expires. This means that if they have a quick change of heart, they can resubscribe immediately (i.e. they don't have to wait for their original subscription to expire). Over in the controller, we just grab their data from the template and fire the appropriate methods:

<p class="block-header">/clients/controllers/authenticated/billing-resubscribe.js</p>

```.lang-javascript
Template.billingResubscribe.events({
  'submit form': function(e){
    e.preventDefault();

    var selectedPlan        = $('[name="selectPlan"]:checked').val(),
        addingNewCreditCard = Session.get('addingNewCreditCard'),
        resubscribeButton   = $(".resubscribe").button('loading');

    var updateSubscription = function(plan){
      Meteor.call("stripeUpdateSubscription", plan, function(error, response){
        if (error){
          resubscribeButton.button("reset");
          Bert.alert(error.message, "danger");
        } else {
          resubscribeButton.button("reset");
          Bert.alert("Successfully resubscribed. Welcome back!", "success");
          Router.go('/billing');
        }
      });
    }

    if (addingNewCreditCard){
      STRIPE.getToken( '#resubscribe', {
        number: $('[data-stripe="cardNumber"]').val(),
        exp_month: $('[data-stripe="expMo"]').val(),
        exp_year: $('[data-stripe="expYr"]').val(),
        cvc: $('[data-stripe="cvc"]').val()
      }, function() {
        var token = $( "#resubscribe [name='stripeToken']" ).val();

        Meteor.call("stripeSwapCard", token, function(error, response){
          if (error){
            resubscribeButton.button("reset");
            Bert.alert(error.message, "danger");
          } else {
            updateSubscription(selectedPlan);
          }
        });
      });
    } else {
      updateSubscription(selectedPlan);
    }
  }
});
```

This should all be familiar by now. In our `submit form` event handler, we start by checking whether or not the user is resubscribing with a _new_ credit card (e.g. they unsubscribed for a year and during that time, were issued a new card). If they _are_ adding a new card, we grab the appropriate data from our template and call up our `stripeSwapCard` method from earlier (first passing our user's card data over to our `STRIPE.getToken()` method).

If they're _not_ adding a new card, we just call to our `stripeUpdateSubscription` method from earlier. The only big thing to note, here, is that we've wrapped our call to `stripeUpdateSubscription` in another function called `updateSubscription`. Why? Because irrespective of _which_ path the customer chooses here, we will eventually need to update their subscription per their choices. Placing this in a function helps us to prevent repeating a bunch of code! [Nerdgasm](http://youtu.be/2FW43MV_6d0?t=1h13m53s)!

Again, since we're reusing code from earlier, we're going to go ahead and skip our usual time warp up to the server. One step left: webhooks!

<div class="note">
  <h3>A quick note</h3>
  <p>Okay. This means we're entering the final stretch of our recipe. Crack your neck, it's sweating time. <a href="http://youtu.be/JsOLaXNvnAs?t=1m8s">Hit those stairs</a>!</p>
</div>

### Webhooks
Feeling the burn? Good. We've got one little (and really cool) thing to do before we can succesfully say we've implemented Stripe. [Webhoooooks](https://i.imgflip.com/hfyen.jpg)! Wait. What the heck is a webhook?

> Webhooks are "user-defined HTTP callbacks". They are usually triggered by some event, such as pushing code to a repository or a comment being posted to a blog. When that event occurs, the source site makes an HTTP request to the URI configured for the webhook.

&mdash; via [Webhook on Wikipedia](http://en.wikipedia.org/wiki/Webhook)

Okay, yeah, whatever you say. But what _is_ a webhook? For our needs, a webhook is a message that Stripe will send us whenever anything happens on Stripe. So, for example, if a customer resubscribes to our applciation, that would _trigger_ a handful of "events" that Stripe would then send to a URL we specify. That URL (which is defined in our app as a server-side route) will then take what Stripe sends us and _do something_ with it. Before we jump into this, though, let's hop over to Stripe to see how to configure webhooks.

#### Configuring Webhooks On Stripe
The first step is to login to the Stripe dashboard and visit [the Webhooks Settings page](https://dashboard.stripe.com/account/webhooks). From here, click the "Add URL" button in the bottom right. A window should reveal itself with two options: "URL" and "Mode." The URL will correspond to a server-side route in our app (e.g. `http://tmc-005-demo.meteor.com/webhooks/stripe`) that we'll define shortly. The _mode_ is simply which webhooks will be sent to this URL: events created in _test_ mode or _live_ mode.

![Configuring Webhooks on Stripe](http://cl.ly/image/0U1q3z1H3N0w/Image%202015-02-09%20at%2010.55.00%20PM.png)

Once this is set, any time an event happens, Stripe will attempt to send a webhook to our specified URL. To make sure this actually works, let's take a look at setting up the route on the server.

<p class="block-header">/server/routes.js</p>

```.lang-javascript
Router.route('/webhooks/stripe', function () {
  var request = this.request.body;

  switch(request.type){
    case "customer.subscription.updated":
      stripeUpdateSubscription(request.data.object);
      break;
    case "invoice.payment_succeeded":
      stripeCreateInvoice(request.data.object);
      break;
  }

  this.response.statusCode = 200;
  this.response.end('Oh hai Stripe!\n');
}, {where: 'server'});
```
Really simple, but really powerful. Just like on the client, we call `Router.route()`, passing the _path_ of our server route `<current domain>/webhooks/stripe`. Before we look at the callback function we're passing, note that at the very end of our route declaration, we're setting the option `where` equal to `server`. By doing this we give our route ["full access to the NodeJS request and response objects."](https://github.com/EventedMind/iron-router/blob/devel/Guide.md#server-routing)

Next, we pass a callback function with a few goodies. First, we take full advantage of our access to Node's `request` and `response` objects. Because we've done a bit of legwork and know that the bulk of the data we'll access will be in the `body` object of the data Stripe sends us, we just drill down to it by default and assign it to a variable `request`.

At the bottom of our function, we call to `this.response.statusCode` setting it to `200` ([HTTP success code](http://en.wikipedia.org/wiki/List_of_HTTP_status_codes#2xx_Success)) and return a little message to Stripe via `this.response.end()`. What's the point of this? Imagine two robots sitting across from one another. One says "bleep blorp" and the other says nothing. What a jerk, Robot #2. By sending a `statusCode` back to Stripe (notice: _our server_ is responding to _Stripe's server_) along with a message, we're letting Stripe know that we heard it ok. This way the webhook succeeds and Stripe goes on its merry way. _Bleep blorp_, indeed.

How about this `switch(request.type)`, though? That's the juicy part. This is where we actually _do something_ with the data Stripe is sending us. We use a `switch` function here because Stripe sends [a _crap load_ of webhooks](https://stripe.com/docs/api#event_types) by default (notice that in the screenshot above you can specify _which_ webhooks you want sent to you). What this is doing is looking at the value of `request.type` (equivalent to `this.request.body.type`) and then deciding which function to fire. What's with this pattern?

Each webhook that we respond to from Stripe is responsible for some sort of action in our application. For our demo and as an example, we're going to update our customer's subscription information in our database whenever we receive the `customer.subscription.updated` event from Stripe. Simplifying this down to a switch that calls a remote function (i.e. in another file) keeps this part of our code neat and tidy. Don't worry, we've got our messiness [waiting for us elsewhere](http://youtu.be/WKGRE7DlB8I?t=37s)!

<div class="note">
  <h3>A quick note</h3>
  <p>It's important to note <em>how</em> we know the shape of the data coming from Stripe. Because those fine lads from Ireland are detail-oriented, they've provided <a href="https://stripe.com/docs/api">detailed documentation</a> that we can reference. In the case of our examples below, we're looking at the <a href="https://stripe.com/docs/api#subscription_object">subscription object</a> and the <a href="https://stripe.com/docs/api#invoice_object">invoice object</a>.</p>
</div>

### Subscription Updated
To keep things a little tidier in our server-side route, we've set up a separate file called `/server/stripe-webhook-functions.js`. Similar to our method files, this is just a collection of functions that store some more complicated functionality. First up, we want to update our customer's information in the database when we receive the `customer.subscription.updated` event from Stripe. Here's how it looks:

<p class="block-header">/server/stripe-webhook-functions.js</p>

```.lang-javascript
stripeUpdateSubscription = function(request){
  var getUser = Meteor.users.findOne({"customerId": request.customer}, {fields: {"_id": 1}});

  if (getUser){
    var update = {
      auth: SERVER_AUTH_TOKEN,
      user: getUser._id,
      subscription: {
        status: request.cancel_at_period_end ? "canceled" : request.status,
        ends: request.current_period_end
      }
    }

    Meteor.call('updateUserSubscription', update, function(error, response){
      if (error){
        console.log(error);
      }
    });
  }
}
```
Hot dog, I bet this looks familiar. Here, we're simply doing a method call to our good ol' friend `updateUserSubscription`. But, we need to pay attention to what we do _before_ that. At the top of our function, we're doing a lookup on our `Meteor.users` collection. Why's that? Well, the data that Stripe is sending us _does not_ include our local `userId`, but it _does_ include our `customerId` (something we have stored locally).

By doing a quick lookup on our `customerId` value equal to `request.customer`, we can ensure that we're performing the subscription update on the _correct_ user. If we didn't include something like this, our webhook could update just about anybody! Ha! That would be fun to explain.

After we're certain we have the correct customer, we go ahead and perform the updates. Voila. Now whenever Stripe sends an event of this type to our server, our customer's account will be updated in our database. Too cool! But wait...what does that mean?

Consider the use case we're going after here. If our customer subscribes to a plan, by default they're trialing for one day. After that trial ends, how will we know when to mark their account as "active?" This is where Stripe shines. Stripe automatically charges the customers card and handles all of the scary stuff for us.

Our only job, then, is to wait until Stripe sends us a webhook, or "hey, I just did this thing" and to process the message it sends us. So, in the scenario here, without needing any interaction on our behalf, we can toggle our customer's account status! Don't think that's cool? Wait until you see money rolling into your bank account. That's what I thought, [shuddup](https://www.youtube.com/watch?v=JUFy28j2jjY).

#### Invoice Payment Succeeded
Last but not least is the `invoice.payment_succeeded` event. This one is pretty simple. It's sole purpose is to insert an invoice for our customer into the database when Stripe has successfully marked it as paid.

<p class="block-header">/server/stripe-webhook-functions.js</p>

```.lang-javascript
stripeCreateInvoice = function(request){
  var getUser = Meteor.users.findOne({"customerId": request.customer}, {fields: {"_id": 1, "emails.address": 1}});

  if (getUser){
    var invoiceItem = request.lines.data[0];
    var totalAmount = request.total;

    if (totalAmount > 0) {
      // Setup an invoice object.
      var invoice = {
        owner: getUser._id,
        email: getUser.emails[0].address,
        date: request.date,
        planId: invoiceItem.plan.id,
        ends: invoiceItem.period.end,
        amount: totalAmount,
        transactionId: Random.hexString(10)
      }

      Invoices.insert(invoice, function(error, response){
        if (error){
          console.log(error);
        }
      });
    }
  }
}
```

Fairly similar to our `stripeUpdateSubscription` function. First, we confirm that we have the correct customer. Next, we make sure that our invoice's total is greater than $0. Why? Well, when our customer starts their trial, Stripe generates an invoice for $0. Doing this check makes sure that an unnecessary invoice doesn't show up in their dashboard. This is one of those behaviors that you may need to tweak for your own app, so make sure to play with it to get it right.

Once we're sure our invoice is for more than nothing, we build an object to insert as the invoice. Once it's ready, we go ahead and pop it into the database! Keep in mind, this is deceptively simple by design. Unlike the majority of our other methods and functions, `stripeCreateInvoice` will only ever be called by our webhook. This means that a direct write to the database is perfectly economical because we won't be needing to share the insert method with any other operations in our application. Cool? Cool.

#### Additional Webhooks
As we mentioned above, Stripe supports a lot of webhooks. Like really, a lot. About ~49 or so. The good news is that you don't have to support all of them. Rather, it's a good practice to consider what things you may want to do with webhooks. The reason we've limited our example here to two (aside from being sleepy) is that those are the only two webhooks we needed to demonstrate. Your own application may need all 49. It's unlikely, but don't just take what you see above as gospel. Do your research!

That's it for webhooks. Very simple, but very powerful. Make sure to play around with them and have some fun. There's a lot that you can do and if you're a Crafty McCrafterson, you can come up with some cool stuff.

### SSL
One more thing before we sign off on this recipe. I wanted to give a nod to one of our readers, [Fawad Mazhar](https://twitter.com/__Fawad). After reading part one, he pointed out that I've totally left out any discussion of SSL! This is really important. When it comes to SSL, per their [SSL guide](https://stripe.com/help/ssl), **Stripe requires the server you're processing payments on to have an SSL certificate installed**.

We've left this out here for simplicity (and because we're only using test data, not real credit cards), but it's definitely a must-have. While setting up an SSL certificate is outside of the scope of this recipe, it should be noted that adding one will require the addition of the [`force-ssl`](https://atmospherejs.com/meteor/force-ssl) package.

Beyond that, as long as you install a certificate and [get a shiny green lock](https://www.youtube.com/watch?v=aLwKMkdVMnQ) up in the URL bar, you're good to go!

### Wrap Up & Summary
Don't freak out, but you've just learned how to integrate Stripe from start to finish in your Meteor application. Shut the front door! In part two, we learned how to help our customer's change their plan, add a new credit card or update an existing one, and retrieve invoices for their payments. We also learned how to display the user's current account status on the page, manage cancellations and resubscriptions, and control account state and invoice inserts with webhooks.

This was a lot of work. No, really. Your eyes are probably bloodshot. Go get some sleep, and dream about that sweet, sweet recurring revenue you're about to earn.

![Baby duck falling asleep](http://media.giphy.com/media/wsEX8uMrTRDoI/giphy.gif)

Until next time!