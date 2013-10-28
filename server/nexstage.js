// Populate for testing
// TODO : Remove after dev
Meteor.startup(function() {

  if (Devices.find().count() === 0) {
    Devices.insert({
      "name": "Arun Zechariah",
      "key": "3sdtDhx7qfBmVJvZeHWLJpbdAjFRR8",
      "status": "available"
    });
    Devices.insert({
      "name": "Vishal Singh",
      "key": "XBgbEJWErc68EeUFrs46Zg1ZmwF5JR",
      "status": "available"
    });

  }
});

// All devices for search
Meteor.publish('devices', function() {
  return Devices.find({}, {
    fields: {
      name: 1,
      key: 1,
      status: 1
    }
  });
});

/**
 * Restrictions for devices collection
 * Don't allow inserts, removes, updates from client
 */
Devices.allow({
  insert: function() {
    return false;
  },
  remove: function() {
    return false;
  },
  update: function() {
    return false;
  }
});

/**
 * All the Todos for publishing on main page
 * TODO : Remove archived ones
 */
Meteor.publish('todos', function() {
  return Todos.find({}, {
    sort: {
      timestamp: -1
    }
  });
});

/**
 * Restrictions for Todos collection
 * TODO: remove and insert using Meter.call methods
 */
Todos.allow({
  update: function() {
    return false;
  }
});

/*
 * Pending reboots only for DDP client to queue reoots
 *Allows DDP client to only recieve pending reboots
 */
Meteor.publish('pending_todos', function() {
  return Todos.find({
    status: {
      $all: [todos.status.requesting]
    }
  });
});

/**
 * setInterval used to set new pending_todos every minute
 */
Meteor.setInterval(function() {
  var momn = Moment().unix();
  Todos.update({
    $and: [{
      status: {
        $all: [todos.status.req_qd]
      }
    }, {
      timestamp: {
        $lte: momn
      }
    }]
  }, {
    $set: {
      status: todos.status.requesting
    },
    $push: {
      "sts": {
        "stat": todos.status.requesting,
        "ts": momn
      }
    }
  }, {
    multi: true
  });
}, config.timer.update_todos);

/**
 * setInterval used to set check for exceptions every 6 hrs
 */
Meteor.setInterval(function() {
  var exceptions = config.exceptions;
  exceptions.forEach(function(element) {
    Meteor.call('set_exception_comment', element, function(err, res) {
      if (err) {
        console.log('Failed to set ', element.name, ' comment to ', element.exception_comment);
      } else if (res) {
        console.log('Updating ', element.name, ' comment to ', element.exception_comment);
      }
    });
  });
}, config.timer.set_exceptions);

Meteor.methods({
  updateStatus: function(a_id, stat) {
    var momn = Moment().unix();
    Todos.update({
      "_id": a_id
    }, {
      $set: {
        "status": stat
      },
      $push: {
        "sts": {
          "stat": stat,
          "ts": momn
        }
      }
    });
    var regex = new RegExp(todos.status.complete);
    if (stat.match(regex)) {
      console.log('going to send email');
      send_email(a_id);
    }

    console.log('Setting ' + a_id + ' to ' + stat);
    return stat;
  },

  /**
   * Insert new device alert request
   */
  insertNewTodo: function(device, requestor, delay, key, msg_text, msg_title) {
    var delaysecs = delay * 60;
    var momn = Moment().unix();
    var tstamp = momn + delaysecs;
    console.log('Queueing for : ' + device + ' -delay ' + delaysecs);
    Todos.insert({
      name: device,
      requestor: requestor,
      device_key: key,
      msg_title: msg_title,
      msg_text: msg_text,
      status: todos.status.req_qd,
      timestamp: tstamp,
      sts: [{
        ts: momn,
        stat: todos.status.req_qd
      }]
    });
  },

  // TODO: Remove - unused !! 
  inExceptionList: function(srv) {
    console.log('checking for ' + srv);
    if (_.contains(config.exceptions, srv)) {
      console.log(0);
      return 0;
    } else {
      console.log(1);
      return 1;
    }
  },

  authenticate: function(user, pswd) {
    // Generate user and command for AD login using LDAP
    var dom_user = user + '@' + config.auth.domain;
    var cmd = [config.auth.cmd, '-h', config.auth.host, '-p', config.auth.port, '-D', dom_user, '-w', pswd].join(' ');
    // Not authorized by default
    var out = 1;
    if (_.contains(config.authorized, user)) {
      // If 0 returned then authorized
      //var out = Execsync.run(cmd);
      var momn = Moment().format('YYYY-MMM-DD HH:mm');
      console.log(user + ' logged in ' + out + ' ' + momn);
    } else {
      // Not authorized
      out = 99;
    }
    return 0;
  },

  set_exception_comment: function(element) {
    console.log('Updating ', element.name, ' comment to ', element.exception_comment);
    Devices.update({
      name: element.name
    }, {
      $set: {
        exception_comment: element.exception_comment
      }
    });
  }

});

function send_email(a_id) {
  var todo = Todos.findOne({
    "_id": a_id
  });
  console.log(todo.requestor);
  var mailto = todo.requestor + config.mail.domain;
  // TODO : set from in config file
  Email.send({
    from: config.mail.from,
    to: mailto,
    subject: config.mail.subj_prefix + todo.name,
    html: "<b>" + todo.status + "</b>"
  });
}