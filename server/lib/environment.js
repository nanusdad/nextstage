config = {};
config.auth = {};

config.mail = {};
config.mail.domain = '@zechariah.net';
config.mail.from = 'arun@zechariah.net';
config.mail.subj_prefix = 'NextStage Status';

config.timer = {};
config.timer.set_exceptions = 6 * 60 * 60 * 1000; // 6 hrs
config.timer.update_todos = 5 * 1000; // 5 secs 