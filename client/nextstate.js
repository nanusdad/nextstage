// Get list of devices
Meteor.subscribe("devices", function() {
  console.log("subscribed to server list");
});

Meteor.subscribe("todos", function() {
  console.log("subscribed to todos list");
});

/**
 * Set default values for sesion variables
 */
Session.setDefault('device_name', 'NONE');
Session.setDefault('logged_in', 'NO');
Session.setDefault('logged_in_user', 'NONE');
Session.setDefault('login_failure', 'NONE');
Session.setDefault('login_failure_msg', 'NONE');
Session.setDefault('pending_count', 'NONE');
Session.setDefault('querying_scm', 'NONE');


//console.log('Get ss', Session.get('server_name'));
//console.log('here : empty server_name');

/**
 * Create drop down list for search
 * @return {[array]} [names of servers available]
 */
Template.search.rendered = function() {
  console.log("rendering");
  $("#helpbutton").popover({
    trigger: "hover"
  });
  $('#search_text').focus();
  return $('.typeahead').typeahead({
    source: function() {
      return _(Devices.find().fetch()).pluck("name");
    }
  });
};

// Return isLoggedIn to main template
// TODO : Maybe user helpers
Template.main.isLoggedIn = function() {
  if (Session.equals('logged_in', 'YES')) {
    return true;
  } else {
    return false;
  }
  //   return Session.get("logged_in");
};

Template.footer.helpers({
  copyright: function() {
    return config.footer.copyright;
  }
});


// Set logged_in session variable 
Template.loginform.events = {
  'click #loginbtn': function() {
    console.log('Clicked Login');
    var user = $('#login_id').val();
    var pswd = $('#pswd').val();

    Meteor.call('authenticate', user, pswd, function(err, res) {
      if (err) {
        console.log('error trying login' + err);
        Session.set('login_failure', true);
      } else {
        console.log('result ' + res);
        if (res == 0) {
          Session.set('logged_in', 'YES');
          Session.set('logged_in_user', user);
        } else {
          Session.set('login_failure', 'YES');
          if (res == 99) {
            Session.set('login_failure_msg', 'Not Authorized.');
          } else {
            Session.set('login_failure_msg', 'Error logging in.');
          }
        }
      }
    });

    return false; // To avoid refresh
  }
};

Template.loginform.login_failed = function() {
  if (Session.equals('login_failure', 'YES')) {
    console.log(Session.get('login_failure'));
    return true;
  } else {
    console.log('Not YES ' + Session.get('login_failure'));
    return false;
  }
};

Template.loginform.rendered = function() {
  $('#login_id').focus();
};

Template.login_failure.failure_msg = function() {
  return Session.get('login_failure_msg');
};

Template.login_failure.events = {
  'click .close': function() {
    Session.set('login_failure', 'NONE');
    return false;
  }
};

// Set server_name for search
Template.search.events = {
  'click #search-nodes': function() {
    var device = $('#search_text').val();
    Session.set('device_name', device);
    Session.set('pending_count', pending_count(device));
    console.log('set focus to schedalertbtn');
    $('#schedalertbtn').focus();
  },
  // TODO :IE does not like this !!
  'keypress input#search_text': function(evt) {
    if (evt.keyCode === 13) {
      var device = $('#search_text').val();
      Session.set('device_name', device);
      Session.set('pending_count', pending_count(device));
      $("#search-nodes").click();
      return false; // To avoid refresh in IE
    }
  },
  'submit #search-nodes': function() {
    var device = $('#search_text').val();
    Session.set('device_name', device);
    Session.set('pending_count', pending_count(device));
  }
};


//  Modal template
// TODO : Maybe use helpers
Template.modal.found_device = function() {
  nn = Session.get('device_name');
  if (nn !== 'NONE') {
    var found = Devices.findOne({
      name: nn
    });
    if (found) {
      return found;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

Template.modal.helpers({
  isNotAvailableForAlert: function(device) {
    console.log('pc ' + Session.get('pending_count'));
    if (!device) {
      return 'Not found';
    } else if (device.status != 'available') {
      return 'Device status is - ' + device.status;
    } else if (device.exception_comment) {
      return device.exception_comment;
    } else {
      return false;
    }
  }
});

Template.modal.rendered = function() {
  //   $("#schedulebtn").addClass('disabled');
  //    $("#rebootnowbtn").addClass('disabled');
  //}
  $("#helpbtn").popover({
    trigger: "hover"
  });
};

Template.modal.events = {
  'click #alertnowbtn': function() {
    device_key = $('#device_key').val();
    mesg_title = $('#mesg_title').val();
    mesg_text = $('#mesg_text').val();
    alert_in(0, device_key, mesg_text, mesg_title);
  },
  'click #30minbtn': function() {
    device_key = $('#device_key').val();
    mesg_title = $('#mesg_title').val();
    mesg_text = $('#mesg_text').val();
    alert_in(30, device_key, mesg_text, mesg_title);
  },
  'click #closebtn': function() {
    reset_close_modal();
    return false; // To avoid refresh in IE
  }
};

// Unset logged_in session variable on logout
Template.navi.events = {
  'click #logout': function() {
    console.log('Clicked Logout');
    Session.set('logged_in', 'NONE');
    Session.set('login_failure', 'NONE');
    Session.set('logged_in_user', 'NONE');
    return false; // To avoid refresh in IE
  }
};

Template.navi.helpers({
  logged_in_user: function() {
    return Session.get('logged_in_user');
  }
});

// Return todos list
Template.todos_list.todos = function() {
  if (Todos.find().count() > 0) {
    return Todos.find({});
  }
};

Template.todos_list.helpers({
  tstampFormat: function(ts) {
    return moment.unix(ts).format('YYYY-MMM-DD HH:mm');
  },
  tstampHrMin: function(ts) {
    return moment.unix(ts).format('HH:mm:ss');
  },
  alertType: function(stat) {
    if (stat.match(todos.chk.complete)) {
      return "alert-success";
    } else if (stat.match(todos.chk.wait)) {
      return "alert";
    } else if (stat.match(todos.chk.fail)) {
      return "alert-error";
    } else {
      return "alert-info";
    }
  },
  isCancellable: function(stat) {
    $('#schedrebootbtn').focus();
    if (stat.match(todos.chk.req_qd)) {
      return true;
    } else {
      return false;
    }
  }
});

Template.todos_list.events = {
  'click .cancelbtn': function(e) {
    var stat = 'Cancelled by ' + Session.get('logged_in_user');
    Meteor.call('updateStatus', this._id, stat, function(err, res) {
      if (err) {
        console.log('Could not cancel' + err);
      } else {
        console.log('Cancelled ' + res);
      }
    });
    return false;
  }
};

Template.ribbon.helpers({
  run_env: function() {
    return config.env.run;
  }
});

function reset_close_modal() {
  $('#search_text').val("");
  Session.set('device_name', 'NONE');
  $("#closebtn").click();
  $('#search_text').focus()
}

function pending_count(srv) {
  return Todos.find({
    $and: [{
      name: srv
    }, {
      status: {
        $not: todos.chk.complete_or_cancelled
      }
    }]
  }).count();
}

function alert_in(mins, key, msg_text, msg_title) {
  Meteor.call('insertNewTodo', Session.get('device_name'), Session.get('logged_in_user'), mins, key, msg_text, msg_title, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      reset_close_modal();
      return false; // To avoid refresh in IE
    }
  });
}