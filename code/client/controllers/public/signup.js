/*
* Controller: Signup
* Template: /client/views/public/signup.html
*/

/*
* Rendered
*/

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
      // Grab the customer's details.
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

      Meteor.call('createTrialCustomer', customer, function(error, response){
        if (error) {
          alert(error.reason);
        } else {
          // Our user exists, so now we can log them in! Note: because we know
          // that we created our user using the emailAddress and password values
          // above, we can simply login with these :) Hot dog, indeed.
          Meteor.loginWithPassword(customer.emailAddress, customer.password, function(error){
            if (error) {
              alert(error.reason);
            } else {
              Router.go('/lists');
            }
          });
        }
      });
    }
  });
}

/*
* Events
*/

Template.signup.events({
  'submit form': function(e){
    // Prevent form from submitting.
    e.preventDefault();
  }
});
