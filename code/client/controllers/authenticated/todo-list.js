/*
*  Controller: Todo List
*  Template: /client/views/authenticated/todo-list.html
*/

/*
* Events
*/

Template.todoList.events({
  'click .btn-danger': function() {
    var listId = this._id;
    var confirmDelete = confirm('Are you sure you want to delete this todo list?');
    if (confirmDelete) {
      Meteor.call('removeTodoList', listId, function(error){
        if (error) {
          alert(error.reason);
        } else {
          Router.go('/lists');
        }
      });
    }
  }
});
