### Getting Started
Although there are multiple parts to this recipe, what we need in terms of packages is actually quite limited.

<p class="block-header">Terminal</p>
```.lang-bash
meteor add meteorhacks:npm
```
We'll make use of the [`meteorhacks:npm`](https://atmospherejs.com/meteorhacks/npm) package to gain access to help us load up the official [Stripe for Node.js](https://www.npmjs.com/package/stripe) package. This will give us access to Stripe's API.

<p class="block-header">Terminal</p>
```.lang-bash
meteor add momentjs:moment
```
Because we'll be working with a handful of dates, we'll make use of the [`momentjs:moment`](https://atmospherejs.com/momentjs/moment) package to help us with things like converting unix timestamps to human readable text.

<p class="block-header">Terminal</p>
```.lang-bash
meteor add random
```
We'll be doing some work on the server later and we'll make use of the [`random`](http://docs.meteor.com/#/full/random) package to help us lock down our methods a bit.

<div class="note">
  <h3>A quick note</h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed above are merely additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base#packages-included">Packages Included</a> list for Base to ensure you have fulfilled all of the dependencies.</p>  
</div>

### Configuring Our App
Before we dive into implementing the Stripe API or managing usage, we need to get a few things setup that will make our life a bit easier down the road. Because we're relying on the [NPM version of the Stripe library](https://www.npmjs.com/package/stripe), we need to let our app know about it.

#### Installing Stripe

First, ensure that you've installed the `meteorhacks:npm` package. After you have, either boot up your application to trigger the creation of a file called `packages.json` in your project's root, or, go ahead and create the file yourself. We need to make sure this file exists because this is how we tell the `meteorhacks:npm` package _which_ NPM packages it needs to download and make accessible for us. We're shooting for something like this:

<p class="block-header">/packages.json</p>
```.lang-javascript
{
  "stripe": "3.0.3"
}
```

Here, we define a single key set to the title of the package on the NPM repository, `stripe`, and assign it a value of `3.0.3`, the latest version of the package available as of writing. Once you've got this set, save your file and then restart your Meteor server. If you watch for it, you'll notice on bootup that Meteor will display a message about NPM dependencies being installed, specifically, Stripe. Awesome work!

#### Defining Settings.json
Now that we have Stripe setup, we need to focus on configuration data. First, in order to successfully access the Stripe API, we need to set a handful of "keys" that we can use to have Stripe acknowledge us. We need these because they're a unique identifier that Stripe will recognize and associate with our Stripe account. To do this, we'll make use of Meteor's `settings.json` file.

[A little known feature](http://docs.meteor.com/#/full/meteor_settings) of Meteor is that you can define a global configuration file in your project's root: `settings.json`. This allows you to store both public _and_ private information that you'd like accessible throughout your application. By default, anything that we put into this file is _private_ and only accessible on the server. In our case, we'll only need private keys as all of work will be done on the server. To get started, create a file in your project root called `settings.json` and open it up.

<div class="note">
  <h3>A quick note</h3>
  <p>In order to complete the next step, you'll need to <a href="https://dashboard.stripe.com/register">signup for an account with Stripe</a>. This will allow you to generate the key's we'll explain below. To get the keys, signup, login to your dashboard, and open up the settings modal. From here, <a href="https://dashboard.stripe.com/account/apikeys">select the "API Keys" tab</a> at the top. From there: copy, paste, money.</p>  
</div>

##### Stripe API Keys
The first thing we want to do is to add our Stripe keys. Stripe gives us four keys total: `sk_test`, `pk_test`, `sk_live`, and `pk_live`. If the labeling isn't clear, there are two sets of keys: _test_ and _live_. The difference is what you'd expect: the test keys are used for _testing_ our application, and the live keys are meant for _production_. Because we're just noodling around, we'll only be making use of our test keys in this recipe. However, we'll showcase flipping over your keys for when you go into production in part two.

<p class="block-header">/settings.json</p>
```.lang-javascript
{
  "public": {
    "stripe": {
      "testPublishableKey": "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
      "livePublishableKey": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
    }
  },
  "private": {
    "stripe": {
      "testSecretKey": "sk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
      "liveSecretKey": "sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

Hang on a sec! You just said we'll only be using our _private_ keys. Right you are. However, it's important to know how to set _both_ your private and public keys. Note: Stripe uses a slightly different naming convention for their keys, so, `private == secret` and `public == publishable`. The meaning is exactly the same, but it's good to pay attention to. Also notice in the above example that we've broken our keys up into two objects `private` and `public`. What gives?

Recall from earlier that by default, our `settings.json` file keeps everything _private_ and only accessible on the server. To get around this, Meteor acknowledges anything we place in our `public` object in our `settings.json` file as "allowed on the client." This is handy for things like storing public keys and other non-sensitive data. For organizational purposes, we've added a `private` object. Keep in mind this isn't _necessary_ for the data inside to show up on the server and merely a personal convention for [keeping things tidy](http://youtu.be/Lzt82V-xtfA?t=2m35s).

Okay, awesome! We've got our keys setup for Stripe, but there's one more thing we want to add to our configuration file before we move on: plan data. This is a bit preemptive as we won't need to access the data for a bit, but it's good to take care of it now.

<p class="block-header">/settings.json</p>
```.lang-javascript
{
  "public": {
    "plans": [
      {
        "name": "tiny",
        "amount": {
          "cents": 5000,
          "usd": "$5"
        },
        "limit": 1,
        "interval": "month"
      },
      {
        "name": "small",
        "amount": {
          "cents": 10000,
          "usd": "$10"
        },
        "limit": 5,
        "interval": "month"
      },
      {
        "name": "medium",
        "amount": {
          "cents": 15000,
          "usd": "$15"
        },
        "limit": 10,
        "interval": "month"
      },
      {
        "name": "large",
        "amount": {
          "cents": 20000,
          "usd": "$20"
        },
        "limit": 20,
        "interval": "month"
      }
    ],
    "stripe": {
      [...]
    }
  },
  "private": {
    [...]
  }
}
```

Hopefully this is obvious. What we're doing here is adding an additional "plans" block to our `public` object in `settings.json`. What this does is give us a global definition for the plans that will be available to customers of our application. Ok...but why? Well, this is one of the fun parts of running a SaaS. If you're doing well, you'll inevitably change or modify your pricing at some point. Having this set here means that whenever we need to reference plan data in our app, we can pull it from here. The punchline? This information is _global_, meaning if we change it here, [our entire application updates](http://media.giphy.com/media/g5iVGDyEldeVi/giphy.gif).

The one thing to pay attention to is that we've added this to our `public` object so that it's accessible on both the client _and_ the server. Did I mention that the server has access to everything stored in the `public` object as well? Hmm, if I didn't...I just did! Onward!

### Signup
The first part of Stripe that we'll be covering in this recipe is our signup flow. This is one of the more important steps because it's _how we get customers into our app_. If this doesn't work, our business doesn't work, so we need to pay attention. The first thing we need to do is pull together a template for our signup page. Let's take a look:

<p class="block-header">/client/views/public/signup.html</p>
```.lang-markup
<template name="signup">
  <form id="application-signup" class="signup">
    <h4 class="page-header">Account details</h4>
    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input type="text" name="fullName" class="form-control" placeholder="Full Name">
    </div> <!-- end .form-group -->
    <div class="form-group">
      <label for="emailAddress">Email Address</label>
      <input type="email" name="emailAddress" class="form-control" placeholder="Email Address">
    </div> <!-- end .form-group -->
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" name="password" class="form-control" placeholder="Password">
    </div> <!-- end .form-group -->
    <h4 class="page-header">Payment Information</h4>
    <label>Which plan sounds <em>amazing</em>?</label>
    {{>selectPlan}}
    <div class="form-group">
      {{>creditCard}}
    </div>
    <div class="form-group">
      <input type="submit" class="btn btn-success btn-block" data-loading-text="Setting up your trial..." style="margin-top: 40px; margin-bottom: 20px;" value="Put me on the rocketship">
    </div> <!-- end .form-group -->
  </form>
</template>
```

Located at `/signup` in our application (I've pre-defined the route for this in `/client/routes/routes-public.js` if you want to take a look), this is the template that controls:

1. Creating an account for our new customer.
2. Capturing their credit card information.
3. Creating a customer on Stripe.
4. Starting a "subscription" for the customer on Stripe.

But wait! We should note that our goal here is _not to charge their credit card_. Instead, we only want to "hold on" to their credit card information, but not charge it. Why? The majority of SaaS products allow customers to "demo" or "trial" their application. We're no different. We want to ensure that our customers get an opportunity to make sure Todoodle is right for them before we charge them.

First, we start by gathering some basic information: a full name, email address, and password for our customer. We've choosen to solely use the `accounts-password` package for this, but you could [extend this to include oAuth logins as well](http://themeteorchef.com/recipes/roll-your-own-authentication). Next, we link to another template `{{>selectPlan}}`. What's that about?

#### Selecting a Plan

<p class="block-header">/client/views/public/signup/select-plan.html</p>
```.lang-markup
<template name="selectPlan">
  <div class="list-group select-plan">
    {{#each plans}}
      <a href="#" class="list-group-item">
        <input type="radio" name="selectPlan" id="selectPlan_{{name}}" value="{{name}}">
        {{capitalize name}}: {{limitString limit}} <span class="pull-right">{{amount.usd}} / {{interval}}</span>
      </a>
    {{/each}}
  </div>
</template>
```

The select a plan block is one of the first spots that we pull in our plan data that we configured in `settings.json` earlier. The goal of this template is two-fold: display all of the available plans to our prospective customer and allow them to pick which one they'd like. Let's take a look at the controller for this as there are a few moving parts that are important to understand.

<p class="block-header">/client/controllers/public/select-plan.js</p>
```.lang-javascript
Template.selectPlan.helpers({
  plans: function(){
    var getPlans = Meteor.settings.public.plans;
    if (getPlans) {
      return getPlans;
    }
  }
});
```

First, we start by adding a helper to our template called `plans`. The thinking here is very simple. All we want to do is return our list of plans from our `settings.json` file. This is done by calling to our settings file by using the `Meteor.settings` method. Just like any other JSON object, here we can just specify the nesting of our plans object using [`. (dot)` notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects). Because our data is stored as an array, we can return it directly to our template without any fuss. Nice!

<p class="block-header">/client/controllers/public/select-plan.js</p>
```.lang-javascript
Template.selectPlan.rendered = function(){
  var firstPlanItem = $('.select-plan a:first-child');
  firstPlanItem.addClass('active');
  firstPlanItem.find('input').prop("checked", true);
}

Template.selectPlan.events({
  'click .list-group-item': function(e){
    var parent = $(e.target).closest('.list-group-item');
    parent.addClass("active");
    $('.list-group-item').not(parent).removeClass("active");
    parent.find('input[type="radio"]').prop("checked", true);
  }
});
```

Next up is a two parter: selecting plans. By default, we want to ensure that we're showing a plan as selected. To help us include the selected plan in our form data, if you look back up at the `selectPlans` template above, you'll notice we have a hidden `radio` input being assigned to each option. This allows us to look at our signup form to get the "checked" value. We hide it on the template as a UX touch. In our controller above, we first handle checking a "default" option when the template is rendered. Here we're just picking the first item/plan in our list, but if you're smart, you'll set this up to automatically select the most popular option based on your [metrics](http://www.quickmeme.com/img/5d/5d8664cf92e4ce604998ebc905667d3186818aee1c8786b9cfd51712eead636e.jpg).

Just below that, we want to handle the event for "checking" our selected option. This is admittedly a bit tricky. Because we're watching for a click event on our `.list-group-item` element, we need to "find" our radio button and check it whenever its parent is clicked. Confused? To help us out, we can use a little jQuery-fu to find the radio button and mark it as checked `parent.find('input[type="radio"]').prop("checked", true);`. Wonderful. This is one of those "more than one way to skin a cat" type of problems, so make sure to play with it!

#### Credit Card Information
Now that we have our plan selected, the next thing we need to do is get credit card information. This, too, has been split into its own template, however, for different reasons. One of the nice things about Meteor is that we can reuse templates anywhere we'd like. In our application, we'll need a credit card form more than once. Thanks to Spacebars and Meteor, we can do this without a lot of headaches. [Oh happy day](http://youtu.be/6zT8AyfsFmA?t=1m28s). Let's take a peek:

<p class="block-header">/client/views/global/credit-card.html</p>
```.lang-markup
<template name="creditCard">
  <div class="row">
    <div class="col-xs-12">
      <div class="form-group">
        <label class="text-success"><i class="fa fa-lock"></i> Card Number (Totes Secure, Like a Bank)</label>
        <input type="text" name="cardNumber" class="form-control card-number" placeholder="Card Number">
      </div>
    </div>
  </div> <!-- end .row -->
  <div class="row">
    <div class="col-xs-4">
      <label>Exp. Mo.</label>
      <input type="text" name="expMo" class="form-control exp-month" placeholder="Exp. Mo.">
    </div>
    <div class="col-xs-4">
      <label>Exp. Yr.</label>
      <input type="text" name="expYr" class="form-control exp-year" placeholder="Exp. Yr.">
    </div>
    <div class="col-xs-4">
      <label>CVC</label>
      <input type="text" name="cvc" class="form-control cvc" placeholder="CVC">
    </div>
  </div> <!-- end .row -->
</template>
```

Pretty straightforward. But there's something to note. Here, we're making use of `name` attributes on each of our fields. [Stripe cautions against this](https://stripe.com/docs/tutorials/forms):

>  Note how input fields representing sensitive card data (number, CVC, expiration month and year) do not have a "name" attribute. This prevents them from hitting your server when the form is submitted.

The reason _we're_ doing this is that we want to validate our credit card form later, which requires the use of `name` attributes. To prevent this information from "hitting the server" like the quote above suggests, we're preventing the default method used to handle the form in our event map:

<p class="block-header">/client/controllers/public/signup.js</p>
```.lang-javascript
Template.signup.events({
  'submit form': function(e){
    e.preventDefault();
  }
});
```

This means that when our signup form is submitted, it will not attempt to pass the values to the server. Instead, our validation will "catch" the event and relay the submission event to its `submitHandler` (see below). You're welcome to implement this however you see fit. I prefer client-side validation in _addition_ to server-side validation (given to us for free by the Stripe API). Forge your own path!

#### Making it Work
Okay. So we've got our templates in place and now we need to start interacting with Stripe. Before we do, we want to do one more thing on the client-side: validation. This is important because it ensures that the data we're sending to Stripe and storing in our database is as correct as possible. The last we thing we want is to think we've signed up a bunch of customers when really we just have a bunch of spam accounts being added.

<p class="block-header">/client/controllers/public/signup.js</p>
```.lang-javascript
Template.signup.rendered = function(){
  $('#application-signup').validate({
    rules: {
      name: {
        required: true
      },
      emailAddress: {
        required: true,
        email: true
      },
      password: {
        required: true,
        minlength: 6
      },
      cardNumber: {
        creditcard: true,
        required: true
      },
      expMo: {
        required: true
      },
      expYr: {
        required: true
      },
      cvc: {
        required: true
      }
    },
    messages: {
      name: {
        required: "Please enter your name."
      },
      emailAddress: {
        required: "Please enter your email address to sign up.",
        email: "Please enter a valid email address."
      },
      password: {
        required: "Please enter a password to sign up.",
        minlength: "Please use at least six characters."
      },
      cardNumber: {
        creditcard: "Please enter a valid credit card.",
        required: "Required."
      },
      expMo: {
        required: "Required."
      },
      expYr: {
        required: "Required."
      },
      cvc: {
        required: "Required."
      }
    },
    submitHandler: function(){
      // We'll handle our actual signup event here.
    }
  });
}
```

Woof. That's a nice chunk of code. It's actually quite simple. What we're doing here is passing our `<form id="#application-signup">` element to our `validate()` method (given to us by `themeteorchef:jquery-validation`), and then specifying rules and messages for each of the fields in our form. Note: this is where we're using the `name` attribute from our fields that we mentioned earlier. Paired with each rule is a "message" that can be output to the user if validation fails. Perfect. Once our form is valid, we call to our validation's `submitHandler` function to complete signup.

<p class="block-header">/client/controllers/public/signup.js</p>
```.lang-javascript
var customer = {
  name: $('[name="fullName"]').val(),
  emailAddress: $('[name="emailAddress"]').val(),
  password: $('[name="password"]').val(),
  plan: $('[name="selectPlan"]:checked').val(),
  card: {
    number: $('[name="cardNumber"]').val(),
    exp_month: $('[name="expMo"]').val(),
    exp_year: $('[name="expYr"]').val(),
    cvc: $('[name="cvc"]').val()
  }
}

var submitButton = $('input[type="submit"]').button('loading');

Meteor.call('createTrialCustomer', customer, function(error, response){
  if (error) {
    alert(error.reason);
    submitButton.button('reset');
  } else {
    if ( response.error ) {
      alert(response.message);
      submitButton.button('reset');
    } else {
      Meteor.loginWithPassword(customer.emailAddress, customer.password, function(error){
        if (error) {
          alert(error.reason);
          submitButton.button('reset');
        } else {
          Router.go('/lists');
          submitButton.button('reset');
        }
      });
    }
  }
});
```

Holy nested functions, Batman! Don't worry. This isn't as complex as it seems. Let's step through it. First, we're defining a new object to store all of the data from our signup form. Simple. Next, as an added UX touch we call to Bootstrap's `.button('loading')` method, passing `loading` as our parameter. This is totally optional (and really, only if you're using Bootstrap), but this allows us to toggle state when our submit button is clicked. So, instead of having the user click and nothing happens, the button changes to read "Setting up your trial..." Pretty good. [Pretty, pretty, pretty, pretty good](http://youtu.be/O_05qJTeNNI?t=18s).

Next, we're calling to a server-side method called `createTrialCustomer`. Can you guess what this does? Let's pause on the client and hop to the server to see what this does for us (hint: it's awesome).

<p class="block-header">/server/methods/signup.js</p>
```.lang-javascript
var Future = Npm.require('fibers/future');

Meteor.methods({
  createTrialCustomer: function(customer){
    check(customer, {
      name: String,
      emailAddress: String,
      password: String,
      plan: String,
      card: {
        number: String,
        exp_month: String,
        exp_year: String,
        cvc: String
      }
    });

    var emailRegex     = new RegExp(customer.emailAddress, "i");
    var lookupCustomer = Meteor.users.findOne({"emails.address": emailRegex});

    if ( !lookupCustomer ) {
      // Our next step will take place in here.
    }
  }
});
```

If you've been following with [our other recipes](http://themeteorchef.com/recipes), this should all look familiar. First, we pass our `customer` argument to our good friend [Check](http://docs.meteor.com/#/full/check). Once we're certain that what we've received from the client is what we expect, we move onto verify that the email address passed doesn't exist in our database already. Why do we do this?

As you'll see in a little bit, we technically create our customer's Meteor account _after_ we've created their account at Stripe (this will make more sense shortly). Checking the email before we do anything else ensures that our customer 1.) doesn't already exist in our database, and 2.) that we're not creating duplicate customers in Stripe. An ounce of prevention...or something like that.

Alright! Next we get into the meat and potatoes of this thing. Once we've verified that we _didn't_ find a user in our database using `if ( !lookupCustomer ) {}` (or, if lookupCustomer returns nothing), we get freaky deaky on some Stripe API calls. Strap in, this might knock you for a loop.

<p class="block-header">/server/methods/signup.js</p>
```.lang-javascript
if ( !lookupCustomer ) {
  var newCustomer = new Future();

  Meteor.call('stripeCreateCustomer', customer.card, customer.emailAddress, function(error, stripeCustomer){
    if (error) {
      console.log(error);
    } else {
      var customerId = stripeCustomer.id,
          plan       = customer.plan;

      Meteor.call('stripeCreateSubscription', customerId, plan, function(error, response){
        if (error) {
          console.log(error);
        } else {
          // If all goes well with our subscription, we'll handle it here.
        }
      });
    }
  });
  return newCustomer.wait();
} else {
  throw new Meteor.Error('customer-exists', 'Sorry, that customer email already exists!');
}
```

So, first things first, we need to talk about how Stripe stores data. You'll notice two method calls here: `stripeCreateCustomer` and `stripeCreateSubscription`. "Customers" in Stripe speak are users who we want to store and interact with more than once. In the context of Todoodle, this would be someone who creates an account and comes back as a paying customer. [Customers in Stripe](https://stripe.com/docs/api#customer_object) are responsible for storing things like a user's email address, payment information, and account status. Subscriptions on the other hand can be thought of as a sort of recurring event: the glue between a `customer` and a `plan` we've defined.

> A subscription ties a customer to a particular plan you've created.
>
> &mdash; [Stripe Subscription Documentation](https://stripe.com/docs/api#subscriptions)

In order to create a subscription, we need to create a _customer_ to bind that subscription to first. This is why we've got the wild nesting going on above. Let's peel back the onion a bit and take a look at creating a customer.

#### Creating a Customer in Stripe
Before we do anything else, we need to create a customer. Before we create a customer (having fun yet?), we need to load in our Stripe NPM package from earlier and pass it our API key. What does that look like?

<p class="block-header">/server/methods/stripe.js</p>
```.lang-javascript
var secret = Meteor.settings.private.stripe.testSecretKey;
var Stripe = Meteor.npmRequire('stripe')(secret);
```

Remember how we installed `meteorhacks:npm` earlier and defined a `package.json` file in our project's root? This is where we make use of it. First, we call to our `settings.json` to obtain our API key. Note: we can access any key/value in this file by calling `Meteor.settings`. From there, we just use dot notation to call to the nested object _in_ that file to access the data we want. Here, we're getting our `testSecretKey` for Stripe.

After we've got it, we create a variable called `Stripe` and load in our package via NPM. Pump the brakes!

<div class="note">
<h3>A quick note</h3>
<p>When using the meteorhacks:npm package, we need to modify how we load in NPM packages. Where we <em>would</em> call Npm.require with a package we loaded directly through Meteor, the meteorhacks:npm package creates a sort of alias Meteor.npmRequire for us to use. Keep in mind: if we <em>do not</em> use this alias, meteorhacks:npm won't know about the package and our application will crash. The more you know!</p>
</div>

Good. So, when loading our Stripe package, notice that we also need to pass our API key via a second pair of parentheses after we load the package: `Meteor.npmRequire('stripe')(secret);`. In a sense, this is like invoking the package as a function and passing our `secret` variable as a parameter. Once this is done, Stripe's API will be accessible. Next, let's look at our method for creating our customer. Finally.

<p class="block-header">/server/methods/stripe.js</p>
```.lang-javascript
stripeCreateCustomer: function(card, email){
  // Note: we'd check() both of our arguments here, but I've stripped this out for the sake of brevity.

  var stripeCustomer = new Future();

  Stripe.customers.create({
    card: card,
    email: email
  }, function(error, customer){
    if (error){
      stripeCustomer.return(error);
    } else {
      stripeCustomer.return(customer);
    }
  });

  return stripeCustomer.wait();
}
```
For all the hullabaloo leading up to this point, this is fairly underwhelming. This is a good thing! Lucky for us, Stripe offers official Node.js support (what Meteor is built on top of), so their API is incredibly simplistic. There are two things to pay attention to in here, first, we're creating a `Future()`. What's that?

Future's allow us to interact with asynchronus functions a little easier. Without this, if we called to `Stripe.customers.create()` we would get nothing in return. This function isn't blocking, meaning our program will call it and keep going. Instead, we want to _wait_ until Stripe responds to us and do something with that value. A future means we can return a `.wait()` method from our Meteor method that quite literally "waits" until it receives a return value. Notice that in our call to `Stripe.customers.create()` we call on the `.return()` method to "pass" the value we get from Stripe back to our waiting return. Let that soak in a bit. Once you realize what's happening you might freak out.

With this in place, we're now getting a `customer` object back from Stripe which can be passed to our next method: `stripeCreateSubscription`. This is called from within the callback of our `stripeCreateCustomer` method. There, we pass our brand new `customerId` and `plan` values (from earlier, as part of the `customer` object we passed to `createTrialCustomer`). Before we jump into the code for this, we need to configure some stuff over at Stripe.

#### Defining Plans
Recall that subscriptions in Stripe are like gluing a `plan` to your `customer`. Up until now, though, the only place we've defined plans is in our application. In order for Stripe to interpret the subscriptions we send to it, we need to [define plans via their dashboard](https://dashboard.stripe.com/test/plans). This is quick and easy, let's take a look.

![Stripe: Plans View](https://s3.amazonaws.com/themeteorchef-cdn/recipes/005_building-a-saas-with-meteor-stripe/stripe-plans-view.png)

Here, we've already defined our plans. We want our plans to be identical to what we've defined in our `settings.json` file so that when we interact with Stripe, we don't have any conflicts. To add a _new_ plan (what you'll need to do), from this screen click on the `+ New` link just beneath the search field.

![Stripe: Create a New Plan](https://s3.amazonaws.com/themeteorchef-cdn/recipes/005_building-a-saas-with-meteor-stripe/stripe-new-plan.png)

This will give you access to the "Create a new plan" modal. This should mostly be straightforward. Of note, make sure that the `ID` field here is identical to the `name` field of the plan in `settings.json`. More specifically, this should be a lowercase version of the plan name. Think of it this way: the `ID` field in this modal is what the computer uses to identify your plan and the `Name` field is what you use to identify the plan.

Aside from this, the only other thing to pay attention to is the `Trial period days` field. This does exactly what you might think: determines how many days _before_ Stripe will process a charge on the card. In the case of our application, we'll set it to one day for demonstration purposes. In your own application, you'll probably want to try a more standard 15, 30, or 60 day trial.

Make sense? Great! Let's get back to the code.

<div class="note">
<h3>A quick note</h3>
<p>You may be asking, can't we automate this a bit? The answer is: yes. Stripe's API is excellent, and you <em>can</em> update, insert, and remove plans using it. If you intend to do a lot of experiments with pricing, it may be worth investing in adding a few methods to handle updating Stripe whenever you change the plans in settings.json. Not necessary, but totally possible and super handy if you have the time.</p>
</div>

#### Creating a Subscription in Stripe

Now that we have a customer setup in Stripe and our plans defined, we can get a subscription in place so that we can charge our customer on a recurring basis. Let's take a look:

<p class="block-header">/server/methods/stripe.js</p>
```.lang-javascript
stripeCreateSubscription: function(customer, plan){
  // Again, we'd do a check() here. Don't skip it!

  var stripeSubscription = new Future();

  Stripe.customers.createSubscription(customer, {
    plan: plan
  }, function(error, subscription){
    if (error) {
      stripeSubscription.return(error);
    } else {
      stripeSubscription.return(subscription);
    }
  });

  return stripeSubscription.wait();
}
```

Oh, Stripe. You're just...so nice to work with. It's almost like deja vu, right? Almost identical to before, we setup our `Future()` (with a different variable name of course) and return instead our `subscription` object. Hot damn! Alright, reverse inception back up to level two in our `createTrialCustomer` method.

<p class="block-header">/server/methods/signup.js</p>
```.lang-javascript
Meteor.call('stripeCreateSubscription', customerId, plan, function(error, response){
  if (error) {
    console.log(error);
  } else {
    try {
      var user = Accounts.createUser({
        email: customer.emailAddress,
        password: customer.password,
        profile: {
          name: customer.name,
        }
      });

      var subscription = {
        customerId: customerId,
        subscription: {
          plan: {
            name: customer.plan,
            used: 0
          },
          payment: {
            card: {
              type: stripeCustomer.cards.data[0].brand,
              lastFour: stripeCustomer.cards.data[0].last4
            },
            nextPaymentDue: response.current_period_end
          }
        }
      }

      Meteor.users.update(user, {
        $set: subscription
      }, function(error, response){
        if (error){
          console.log(error);
        } else {
          newCustomer.return(user);
        }
      });
    } catch(exception) {
      newCustomer.return(exception);
    }
  }
});
```

Okay, starting to make some sense? With our `stripeCreateSubscription` method complete, we finally create our user in the database. Take note of what's happening here. Because we've made it to this step, we can rest assured that our customer and their subscription exist in Stripe. Here, we take what Stripe has given us and insert it into our own database. This will make it easier to keep track of customers later. To create the account, we use the `emailAddress` and `password` values we pulled from our signup form earlier. But wait a second...what is this `try` and `catch` business?

On the server, Meteor doesn't allow `Accounts.createUser()` to have a callback. This would be fine, but what if calling this produces an error? JavaScript's [`try/catch`](http://eloquentjavascript.net/08_error.html#p_ZBsTKhGA4i) to the rescue! This is sort of like an `if/else` in that it's saying "ok, _try_ this snippet of code and if it throws an error or exception, pass the exception to the _catch_." In the event that `createUser` fails, we can "catch" its exception and return it to the client.

Before we do that, though, we've got something funky going on. Because we want to store our customer's subscription data in a way that _isn't_ immediately visible by calling `Meteor.users.find()` on the client, we need to update our user immediately after they've been created with `Accounts.createUser()`. Why?

Because `Accounts.createUser()` only allows us to specify a `username/email`, `password`, and `profile` object, if we were to set our `subscription` and `customerId` information within this method, it would be ignored.

To get around this, we can set the value of `Accounts.createUser()` to a variable (this is equal to the new user's `userId` once it's available), and then perform an update on that user. In the update, we simply pass the `subscription` object we want to store in the root of the user object in our database. A good bit of work, but handy if we want to obscure our subscription data.

Finally, notice just like with our Stripe methods, we're using a Future here to "wait" for a value to send back to the client.

Once we have that value (if our method succeeds, this value is arbitrary, if it fails, this value will contain an error to display on the client), we can return to the client. [Zwoop! Back up another level](http://youtu.be/cMkmGb1W-9s?t=1m1s).

#### Returning to the Client
Okay, so we're all setup with Stripe, our user exists in the database...now what? Now, we must bow down to the User Experience Gods and complete our signup flow. Let's see how we do it.

<p class="block-header">/client/controllers/public/signup.js</p>
```.lang-javascript
Meteor.call('createTrialCustomer', customer, function(error, response){
  if (error) {
    alert(error.reason);
    submitButton.button('reset');
  } else {
    if ( response.error ) {
      alert(response.message);
      submitButton.button('reset');
    } else {
      Meteor.loginWithPassword(customer.emailAddress, customer.password, function(error){
        if (error) {
          alert(error.reason);
          submitButton.button('reset');
        } else {
          Router.go('/lists');
          submitButton.button('reset');
        }
      });
    }
  }
});
```

Okay, so. There are a few tricks going on here to tie up all of our loose ends. The first is that we're watching for an `error` on our method, and if one occurs, alerting the given reason for the error _and_ (ready for this???), resetting the state of our submit button from earlier. Note: this doesn't reset our entire form, but rather, makes it possible to "click" submit again. Woo doggie.

After this, in our `else`, we're looking for _another_ error. [What, what, what](https://www.youtube.com/watch?v=_3PUu88nOcw)? Recall that on the server, we were using a `Future` to "wait" on Stripe for a response. Because of this, in the event that our method throws an error on the server, we return it to the client, _but_ it comes through in the response argument. Because of this, for added precaution we want to ensure that an error object _is not_ defined on the response. If it is, we do our hot little button reset trick. If not...

Time to login our user! This is actually pretty cool. Because we technically already "know" our user's email address and password (remember, these were defined earlier in our `customer` object at the top of our `submitHandler`), we can just "reuse" these to log them in. We can get away with this because at this point, we know they have an account in our database with these values. Sneaky!

Finally, in the callback of `loginWithPassword`, we test for an error _one more time_ and if all is well, redirect the user to the `/lists` view where they can see their current todo lists. We also reset the button again for good measure. Woah! Our signup flow is complete. At this point, we've succesfully signed our user up for an account with a trial on Stripe. [High fives all around](http://media2.giphy.com/media/DohrJX1h2W5RC/giphy.gif)!

<div class="note">
  <h3>A quick note</h3>
  <p>Alright, you know what time it is. Let's take a break and do a little exercise before we keep going. <a href="http://youtu.be/Y6leITt0gJ8?t=7m">1 and 2 and 3 and...</a></p>
</div>

### Managing Usage
In our SaaS app, we're offerring todo lists to customers in different tiers (this is what we mapped out in our plan data above). Because of this, we'll need to have some sort of mechanism for keeping track of how many lists a user has created and check that against the _limits_ of their plan. So, if one of our customers, Jane Windex, signs up for the "small" plan, we only want her to have the ability to create five todo lists. If she tries to create more than this, we want to block her ability to do so and suggest that she upgrade her account. How do we do that?

##### Using Template Helpers to Block Visibility
Because we have the power of reactivity with Meteor, we can do some really cool stuff using Spacebars templates. In our case, we can wrap the parts of our interface that we want to display _conditionally_. For example, if a user has a "Small" plan and they've used up 5 of their 5 available lists, we want to _hide_ the UI that allows them to add more.

<p class="block-header">/client/views/authenticated/todo-lists.html</p>
```.lang-javascript
<template name="todoLists">
  <div style="margin-top: 0px;" class="page-header clearfix">
    <h3 class="pull-left">Todo Lists</h3>
    {{#if listsAvailable}}
      <a href="#" style="margin-top: 15px;" class="btn btn-success pull-right">New Todo List</a>
    {{/if}}
  </div>
  {{#unless listsAvailable}}
    <p class="alert alert-warning">Heads up! You've hit your list limit for your current plan (<strong>{{capitalize plan.subscription.plan.name}} - {{plan.limit}}</strong>). <a href="{{pathFor 'billingPlan'}}">Upgrade Now</a></p>
  {{/unless}}
  [...]
</template>
```
See what's going on here? We've setup a helper `{{listsAvailable}}` that allows us to check whether our current user has lists available on their plan or not. Here, we start by wrapping our "New Todo List" button in an `{{#if listsAvailable}}` helper. This means that _if_ our helper returns true, or, the user has lists available: we'll show them the "New Todo List" button. If not, poof! Cool, right?

Next, we do the inverse of this by making use of Spacebar's (actually, Handlebars) `{{#unless}}` helper, again passing `listsAvailable` as our value to test against. Here, if `listsAvailable` returns `false`, we display a "heads up" message that suggests the [user should upgrade](https://www.youtube.com/watch?v=aocZo3oeNxw).

Okay! This makes sense... sort of. How does it _actually work_, though?

##### Wiring Up Our Template Visibility

We've got two things going on here, but let's start with `listsAvailable`. We're using some sneaky behavior here to prevent making the user's plan data available to the client.

<p class="block-header">/client/controllers/authenticated/todo-lists.js</p>
```.lang-javascript
Template.todoLists.helpers({
  listsAvailable: function(){
    var user      = Meteor.userId(),
        available = Session.get('userListsAvailable_' + user);

    if ( user ) {
      Meteor.call('checkUserQuota', user, function(error, response){
        if (error) {
          alert(error.reason);
        } else {
          Session.set('userListsAvailable_' + user, response);
        }
      });
    }
    return available;
  },
  [...]
});
```

So where we might do a `Meteor.users.find()` here, we're instead delegating all of this to the client through a method called `checkUserQuota`. Here, we get our user's ID and when it's available, call to the method on the server. Before we explain how we get the data out to the template, let's hop over to the server and look at the `checkUserQuota` method.

<p class="block-header">/server/methods/data/read/users.js</p>
```.lang-javascript
Meteor.methods({
  checkUserQuota: function(user){
    check(user, String);

    var getUser  = Meteor.users.findOne({"_id": user}, {fields: {"subscription.plan": 1}}),
        plan     = getUser.subscription.plan,
        planName = plan.name,
        used     = plan.used;

    var availablePlans = Meteor.settings.public.plans;
    var currentPlan    = _.find(availablePlans, function(plan){ return plan.name == planName; });
    var limit          = currentPlan.limit;

    if( used < limit ){
      return true;
    } else {
      return false;
    }
  },
  [...]
});
```

This one is interesting. We want our method to do two things: get the current user's subscription information (specifically, we want the user's plan data) and then we want to get our global plan data from `settings.json`. The goal here is to see whether or not the user's `subscription.plan.used` value is less than the gobal limit for their plan type. If it is, we return `true`, if it's not, we return `false`. Why do this here?

The reason we do this here is that it avoids having to expose the user's subscription information on the client. Our server has access to all of a user's data, which means we can have it do the messy checking work without mucking up our client-side controller. This is one of those stylistic things that, while not _entirely_ necessary, helps to keep your code a little bit cleaner.

There's one thing above that may not be entirely clear. Above we're making use of the `_.find()` method given to us by the `underscore` package. This function is really handy. First, we pass our `availablePlans` array which is equal to the list of plans we've defined in our `settings.json` file. Next, for each plan, we compare the plan's `name` field to our user's `plan.name` field. This essentialy "plucks" the plan that our user is signed up for out of the array and sets it euqal to our `currentPlan` variable. Cool, right?

<p class="block-header">/client/controllers/authenticated/todo-lists.js</p>
```.lang-javascript
Meteor.call('checkUserQuota', user, function(error, response){
  if (error) {
    alert(error.reason);
  } else {
    Session.set('userListsAvailable_' + user, response);
  }
});
```
Back on the client, we take the returned `true` or `false` value and set it equal to a `Session` variable that's unique to our current user. The reason we're doing this here is that if we were simply to return our value from our method, our helper wouldn't be able to "see" it. Doing this ensures that the value is made accessible to the helper when it's ready. Neat! Outside of our method call, we simply return a variable `available` from our helper that's assigned to `Session.get('userListsAvailable_' + user)`.

It should be obvious now, but as we're simply returning `true` or `false`, this will correctly toggle our template helpers, revealing the proper UI depending on the user's account status. [Woah](http://media.giphy.com/media/nVkpHJrIwcI8/giphy.gif).

##### Controlling the Quota
So we have a way for checking the quota in place, but how do we actually _control_ that quota? Notice that in our `/lists` view, you have the ability to create new lists. Additionally, if you click into an individual list, you have the ability to delete a list. What do these do?

This is how we determine quota. Each of these buttons (in addition to adding or deleting a list) also call to a server method to _increment_ or _decrement_ the current user's number of "used" lists. Let's take a look at the `insert` method to see what this looks like in practice.

<p class="block-header">/server/methods/data/insert/todo-lists.js</p>
```.lang-javascript
var newList = TodoLists.insert(list, function(error){
  if (error) {
    console.log(error);
  } else {
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"subscription.plan.used": 1}});
    if (getUser) {
      var newQuota = ++getUser.subscription.plan.used;
      var update   = {auth: SERVER_AUTH_TOKEN, user: user, quota: newQuota};
      Meteor.call('updateUserQuota', update, function(error){
        if(error){
          console.log(error);
        }
      });
    }
  }
});
```

This should look somewhat familiar. Here, we're managing the quota in the _callback_ of our `TodoLists.insert` method. First, we start by getting the current user, passing a projection to our `findOne` to specify that we only need the `used` key of the `subscription.plan` object. Next, once we have our user, we set a variable `newQuota` equal to the the current number of used lists _plus one_ (the `++` prepended to our key simply means "increment by one").

But then we introduce something interesting. In the object we're defining to update the user with, we have something called `SERVER_AUTH_TOKEN`. What the heck is that?

This is something that was discovered while implementing this feature. Because the method we're trying to call to `updateUserQuota` is potentially destructive (i.e. a user could add or remove lists from their plan in the console), I wanted to find a way to _block_ this behavior. The solution I came up with is to create some sort of identifier that's only available on the server, but accessible to all of our server-side methods.

Enter: `SERVER_AUTH_TOKEN`. Over in our `/server/admin/startup.js` file, we've defined `SERVER_AUTH_TOKEN` as a global variable that's equal to a call to `Random.secret()`. Here, we're making use of the `random` package we installed earlier and calling on its `.secret()` method. What this gets us is a completely random, 43 character string whenever our server boots up. This means that the string cannot be guessed and therefore, something we can trust is only accessible on the server.

<p class="block-header">/server/methods/data/update/users.js</p>
```.lang-javascript
  updateUserQuota: function(update){
    check(update, {auth: String, user: String, quota: Number});

    if ( update.auth == SERVER_AUTH_TOKEN ){
      Meteor.users.update(update.user, {
        $set: {
          "subscription.plan.used": update.quota
        }
      }, function(error){
        if (error) {
          console.log(error);
        }
      });
    } else {
      throw new Meteor.Error('invalid-auth-token', 'Sorry, your server authentication token is invalid.');
    }
  }
});
```

Usage of the token is pretty straightforward. Above, we can see the `updateUserQuota` method that we're calling and passing our `SERVER_AUTH_TOKEN` to. After `check()`ing our argument for validity, we simply do an `if` statement to see if the `auth` value passed to our method is equal to our global `SERVER_AUTH_TOKEN`. If they _are_ equal, we allow the update on the user, _incrementing_ or _decrementing_ their `used` lists value. If they are not equal, we simply throw an error that can be returned on the client (e.g. if a user tried to call this method from their browser's console, they'd see our error displayed there).

##### A wee bit of controversy

The above pattern using `SERVER_AUTH_TOKEN` is a bit controversial. Before this recipe was released, I [published this pattern on GitHub](https://github.com/themeteorchef/server-only-methods) and shared it with the Meteor community. A few people suggested that using the `SERVER_AUTH_TOKEN` part was unnecessary, as you can actually check the value of `this.connection` to see if it equals `undefined` (it does when a request originates from the server). In testing, I found that this _does_ work, but **only** if the request starts on the server (e.g. you have an automated script on the server to call the method).

If the request in any way originates from the client, `this.connection` still returns a value (e.g. in the above example, our request originates on the client, but our `updateUserQuota` function is actually triggered from the server from within another method). This means that in our use case above, we need an alternative to `this.connection`. A bit confusing, but something to keep in mind if you want to make use of server-only methods. Make sure to [look at the history for the snippet](https://github.com/themeteorchef/server-only-methods/commits/master) I prepared over on GitHub to get a better understanding.

<div class="note">
<h3>A quick note</h3>
<p>The above example showcases incrementing or adding lists and how they impact the quota, however, for the sake of brevity I've left out decrementing or removing lists. The patterns are nearly identical, save for the result they produce. To see the "remove" version of this, check out `/server/methods/data/remove/todo-lists.js`.</p>
</div>

##### Displaying the User's Plan
There's one more thing we need to call attention to before we move on. Notice that back in our `todoLists` template, when the user _does not_ have lists available, we display an alert message that lets the user know their current plan. Where the heck is that coming from?

<p class="block-header">/client/helpers/helpers-ui.js</p>
```.lang-javascript
UI.registerHelper('plan', function(){
  var user = Meteor.userId(),
      plan = Session.get('currentUserPlan_' + user);

  if ( user ) {
    Meteor.call('checkUserPlan', user, function(error, response){
      if (error) {
        alert(error.reason);
      } else {
        Session.set('currentUserPlan_' + user, response);
      }
    });
  }
  return plan;
});
```
Because we're making reference to the user's plan data in multiple spots within our application, we can make a UI helper that returns this inforamation for us. This means that instead of having to call the same code in multiple locations, we can simply make one call via a helper and then access the data through a template helper.

Here, we've setup `{{plan}}` to be a helper that's accessible anywhere in our app. Notice that we use the same `Session` variable trick from the `listsAvailable` helper in our `todoLists` template. What exactly is `plan` returning, though?

<p class="block-header">/server/methods/data/read/users.js</p>
```.lang-javascript
checkUserPlan: function(user){
  check(user, String);

  var getUser  = Meteor.users.findOne({"_id": user}, {fields: {"subscription": 1}}),
  subscription = getUser.subscription;

  var availablePlans = Meteor.settings.public.plans;
  var currentPlan    = _.find(availablePlans, function(plan){ return plan.name == subscription.plan.name; });
  var limit          = currentPlan.limit;
  var amount         = currentPlan.amount.usd;

  if( subscription && limit ){
    var planData = {
      subscription: subscription,
      limit: limit > 1 ? limit + " lists" : limit + " list",
      amount: amount
    }
    return planData;
  } else {
    return false;
  }
}
```

This is very similar to our `checkUserQuota` method, but instead of determining whether the user has todo lists available, here we expose their plan data to our helper. Just like before, we pull up the user's plan information and use the underscore `_.find()` method to compare against our global plan data.

Next, we create a new object `planData` to return to the client that includes the information we want accessible to our helper. As a little UX touch, we use a ternary operator to check the limit on the plan and append a string corresponding to the plan's plurarlity. So, for example, if our user's limit is one, we get the correct contextual `1 list` string, or if they have 5, we get `5 lists`. Go ahead, [flex](http://youtu.be/rec_7Si0MEA?t=1m4s), that's pretty boss.

<p class="block-header">/client/views/authenticated/todo-lists.html</p>
```.lang-javascript
<p class="alert alert-warning">Heads up! You've hit your list limit for your current plan (<strong>{{capitalize plan.subscription.plan.name}} - {{plan.limit}}</strong>). <a href="#">Upgrade Now</a></p>
```

Note that now on the client, we can access our plan information via the `{{plan}}` helper! It's a subtle touch, but very important as it guides our user down the correct path.

<div class="note">
<h3>A quick note</h3>
<p>In the example above, we're actually combing two helpers: capitalize and plan. We've explained plan, however, capitalize is an additional helper created to capitalize the first letter of the string we pass. We're doing this here because our returned plan is lowercase and sometimes we need to capitalize it. If you're curious how this is done, header over to /client/helpers/helpers-ui.js to see it in action!</p>
</div>

#### Displaying the User's Plan on the Billing Screen

Home stretch! There's just one more thing that we need to do before we leave the rest to part two. Over in our user's `/billing` view (specifically our `billingOverview` template), we want to display their plan information so they can see the status of their account and decide whether or not to upgrade/downgrade.

<p class="block-header">/client/views/authenticated/billing/_billing-overview.html</p>
```.lang-markup
<template name="billingOverview">
  <div class="panel panel-default billing-module">
    <div class="panel-heading">
      <h3 class="panel-title">Billing Overview</h3>
    </div>
    <div class="panel-body">
      <ul class="list-group">
        <li class="list-group-item bm-block clearfix">
          <span class="bm-block-label">Current Plan</span>
          <div class="bm-block-content">
            <span class="plan-name-quota"><strong>{{capitalize plan.subscription.plan.name}}</strong> &mdash; {{plan.subscription.plan.used}} of {{plan.limit}} used</span>
            <div class="usage-bar">
              <div class="used" style="width:{{percentage plan.subscription.plan.used plan.limit}};"></div>
            </div>
          </div>
          <a href="{{pathFor 'billingPlan'}}" disabled="disabled" class="btn btn-small btn-default pull-right">Change Plan</a>
        </li>
        <li class="list-group-item bm-block clearfix">
          <span class="bm-block-label">Payment</span>
          <div class="bm-block-content">
            <span><strong>{{plan.subscription.payment.card.type}}</strong> &mdash; {{plan.subscription.payment.card.lastFour}}</span>
            <span>Next payment due: <strong>{{epochToString plan.subscription.payment.nextPaymentDue}}</strong></span>
            <span>Amount: <strong>{{plan.amount}}</strong></span>
          </div>
          <a href="{{pathFor 'billingCard'}}" disabled="disabled" class="btn btn-small btn-default pull-right">Update Card</a>
        </li>
      </ul>
    </div>
  </div>
</template>
```
A few things to pay attention to. First, we display the user's current plan information (number of lists used of those available) by accessing our `{{plan}}` template helper from earlier. This is straight forward: we're just outputting the values to the page. But just beneath that...wait, woah, what is that? A usage bar!

<p class="block-header">/client/views/authenticated/billing/_billing-overview.html</p>
```.lang-markup
<div class="usage-bar">
  <div class="used" style="width:{{percentage plan.subscription.plan.used plan.limit}};"></div>
</div>
```

Making use of our `{{plan}}` helper and a dash of CSS-fu, we can display the user's current plan usage as a percentage of a bar! To do it, we make use of a helper `{{percentage}}` that we've defined in `clients/helpers/helpers-ui.js` that takes our user's current lists `used` value and divides it by their current plan's `limit`. The result is a percentage that we can use to set the width on the "used" bar to visually show how much of a plan has been used. [Oh dear](http://media2.giphy.com/media/QHXvwJwtUBLBm/giphy.gif).

Last but not least, just beneath this block we display our user's payment information...

<p class="block-header">/client/views/authenticated/billing/_billing-overview.html</p>
```.lang-markup
<div class="bm-block-content">
  <span><strong>{{plan.subscription.payment.card.type}}</strong> &mdash; {{plan.subscription.payment.card.lastFour}}</span>
  <span>Next payment due: <strong>{{epochToString plan.subscription.payment.nextPaymentDue}}</strong></span>
  <span>Amount: <strong>{{plan.amount}}</strong></span>
</div>
```
Just like before, thanks to our `{{plan}}` helper we can call this information up toot sweet. Now, our user can see all of their current plan information on screen! Not exciting to you? Consider this is how they'll decide whether or not they should keep their subscription active. Yeah. That's what pays for your dog food, bro. Don't hate.

#### That's it!
We did it! Well, at least part of it. This concludes part 1 of 2. It was a lot of work, so give yourself a pat on the back.

![Zack and Slater patting themselves on the back](http://media.giphy.com/media/9Q249Qsl5cfLi/giphy.gif)

### Wrap Up & Summary
Very cool stuff. In this recipe we learned how to sign users up for our app, create a customer with a subscription on Stripe, and show our customer's their plan information. We also learned how to trigger state in our app to encourage customer's to upgrade if and when they hit their current plan's limits, and how to determine when to display that state by managing the customer's quota. Wild stuff.

#### In part two...
We'll take a look at helping our customer update their plan information, cancel their subscription (nooo!), manage their credit card, and send invoices when our plan renews! Get excited. When we're done, we'll have a full-blown payments system using Stripe.

Until next time!
