todos = {};
todos.status = {};
todos.status.req_qd = 'Alert request queued';
todos.status.requesting = 'Requesting alert';
todos.status.complete = 'Alert complete';
todos.status.cancelled = 'Cancelled';

todos.chk = {};
todos.chk.complete_or_cancelled = new RegExp(todos.status.complete + '|' + todos.status.cancelled, 'i');
todos.chk.complete = new RegExp('complete', 'gi');
todos.chk.fail = new RegExp('fail', 'gi');
todos.chk.wait = new RegExp('wait', 'gi');
todos.chk.req_qd = new RegExp(todos.status.req_qd, 'g');