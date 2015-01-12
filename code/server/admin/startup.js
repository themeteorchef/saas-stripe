/*
* Startup
* Collection of methods and functions to run on server startup.
*/

/*
* Generate Server Authentication Token
* Create a token on startup to identify the server when calling methods. This
* allows the server to call certain methods, but not the client (e.g. if a user)
* discovers the name of a method that's "destructive," we can prevent any bad
* actions by checking against this token (which they cannot see). Note, we use
* the random package to generate our token so that it's even less discoverable.
*/

// Here, we're calling on Random's secret method which creates a 43 character
// string with 256 bits of entropy. Per the Meteor docs: "Use Random.secret for
// security-critical secrets that are intended for machine, rather than human,
// consumption." This is what we want because only our method(s) will check this
// value, not us (humans).
SERVER_AUTH_TOKEN = Random.secret();

/*
* Generate Test Accounts
* Creates a collection of test accounts automatically on startup.
*/

// Create an array of user accounts.
var users = [
  {
    name: "Andy Warhol",
    email: "andy@warhol.com",
    password: "your15minutesisup",
    subscription: {
      plan: {
        type: "small",
        lists: "5"
      },
      payment: {
        card: {
          type: "Visa",
          lastFour: "1234"
        },
        nextPaymentDue: ( new Date() ).getTime()
      }
    }
  }
]

// Loop through array of user accounts.
for(i=0; i < users.length; i++){
  // Check if the user already exists in the DB.
  var userEmail = users[i].email,
      checkUser = Meteor.users.findOne({"emails.address": userEmail});

  // If an existing user is not found, create the account.
  if( !checkUser ){
    Accounts.createUser({
      email: userEmail,
      password: users[i].password,
      profile: {
        name: users[i].name,
        subscription: users[i].subscription
      }
    });
  }
}
