### Getting Started
Although there are multiple parts to this recipe, what we need in terms of packages is actually quite limited.

<p class="block-header">Terminal</p>
```.lang-bash
meteor add meteorhacks:npm
```
We'll make use of the [`meteorhacks:npm`](https://atmospherejs.com/meteorhacks/npm) package to gain access to help us load up the official [Stripe for Node.js]() package. This will give us access to Stripe's API.

<p class="block-header">Terminal</p>
```.lang-bash
meteor add momentjs:moment
```
Because we'll be working with a handful of dates, we'll make use of the [`momentjs:moment`](https://atmospherejs.com/momentjs/moment) package to help us with things like converting unix timestamps to human readable text.

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

[A little know feature](http://docs.meteor.com/#/full/meteor_settings) of Meteor is that you can define a global configuration file in your project's root: `settings.json`. This allows you to store both public _and_ private information that you'd like accessible throughout your application. By default, anything that we put into this file is _private_ and only accessible on the server. In our case, we'll only need private keys as all of work will be done on the server. To get started, create a file in your project root called `settings.json` and open it up.

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

Recall from earlier that by default, our `settings.json` file keeps everything _private_ and only accessible on the server. To get around this, Meteor acknowledges anything we place in our a `public` object in our `settings.json` file as "allowed on the client." This is handy for things like storing public keys and other non-sensitive data. For organizational purposes, we've added a `private` object. Keep in mind this isn't _necessary_ for the data inside to show up on the server and merely a personal convention for [keeping things tidy](http://youtu.be/Lzt82V-xtfA?t=2m35s).

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

<p class="block-header">/settings.json</p>
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
      <p>After you click, we'll setup your account and start your trial. Again, <strong>your card will not be charged until your trial has ended</strong>.</p>
    </div> <!-- end .form-group -->
  </form>
</template>
```

Note: our actual template is _slightly_ more complex than this (the version [in the source]() contains some "heads up" messages for customers and some Bootstrap grid elements). Here, we're focused on just the `<form>` element where the real action happens. Lucky for us, this is actually pretty simple.

First, we start by gathering some basic information: a full name, email address, and password for our customer. We've choose to solely use the `accounts-password` package for this, but you could [extend this to include oAuth logins as well](http://themeteorchef.com/recipes/roll-your-own-authentication). Next, we link to another template `{{>selectPlan}}`. What's that about?

#### Selecting a Plan

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

Select plan is one of the first spots that we pull in our plan data that we configured in `settings.json` earlier. The goal of this templateis two-fold: display all of the available plans to our prospective customer and allow them to pick which one they'd like. Let's take a look at the controller for this as there are a few moving parts that are important to understand.

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

Just below that, we want to handle the event for "checking" our selected option. This is admittedly a bit tricky. Because we're watching for a click event on our `.list-group-item` element, we need to "find" our radio button and check it whenever it's parent is clicked. Confused? To help us out, we can use a little jQuery-fu to find the radio button and mark it as checked `parent.find('input[type="radio"]').prop("checked", true);`. Wonderful. This is one of those "more than one way to skin a cat" type of problems, so make sure to play with it!

#### Credit Card Information
Now that we have our plan selected, the next thing we need to do is get credit card information. This, too, has been split into its own template, however, for different reasons. One of the nice things about Meteor is that we can reuse templates anywhere we'd like. In our application, we'll need a credit card form more than once. Thanks to Spacebars and Meteor, we can do this without a lot of headaches. [Oh happy day](http://youtu.be/6zT8AyfsFmA?t=1m28s). Let's take a peek:

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

```.lang-javascript
Template.signup.events({
  'submit form': function(e){
    // Prevent form from submitting.
    e.preventDefault();
  }
});
```

This means that when our signup form is submitted, it will not attempt to pass the values to the server. Instead, our validation will "catch" the event and relay the submission event to its `submitHandler` (see below). You're welcome to implement this however you see fit. I prefer client-side validation in _addition_ to server-side validation (given to us for free by the Stripe API). Forge your own path!

Located at `/signup` in our application (I've pre-defined the route for this in `/client/routes/routes-public.js` if you want to take a look), this is the template that controls:

1. Creating an account for our new customer.
2. Capturing their credit card information.
3. Creating a customer on Stripe.
4. Starting a "subscription" for the customer on Stripe.

But wait! We should note that our goal here is _not to charge their credit card_. Instead, we only want to "hold on" to their credit card information, but not charge it. Why? The majority of SaaS products allow customers to "demo" or "trial" their application. We're no different. We want to ensure that our customers get an opportunity to make sure Todoodle is right for them before we charge them. Before we get too far into details, let's see how this template works.



### Managing Usage
In our SaaS app, we're offerring todo lists to customers in different tiers (this is what we mapped out in our plan data above). Because of this, we'll need to have some sort of mechanism for keeping track of how many lists a user has created and check that against the _limits_ of their plan. So, if one of our customers, Jane Windex, signs up for the "small" plan, we only want her to have the ability to create five todo lists. If she tries to create more than this, we want to block her ability to do so and suggest that she upgrade her account. How do we do that?
