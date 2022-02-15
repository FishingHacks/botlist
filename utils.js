const { inspect } = require("util");

module.exports = {
  removeDuplicates: removeDuplicates,
  getDate: getDate,
  log: log,
  info: info,
  error: error,
  warn: warn,
  inspect,
  ensure,
};

function ensure(obj, template) {
  for (el in template) {
    if (typeof template[el] == typeof {}) {
      if (!obj[el]) {
        obj[el] = ensure({}, template[el]);
      } else {
        obj[el] = ensure(obj[el], template[el]);
      }
    } else {
      if (!obj[el]) {
        obj[el] = template[el];
      }
    }
  }
  return obj;
}

function removeDuplicates(a) {
  return a.filter(function (item, pos) {
    return a.indexOf(item) == pos;
  });
}

function getDate() {
  return (
    new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
  );
}

function _log(message, safemessage, func) {
  message = message.replaceAll(
    "${date}",
    new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
  );
  message = message.replaceAll("${dir}", __dirname);
  func(message + safemessage);
}

function log(message, safemessage) {
  _log(message, safemessage, console.log);
}

function info(message, safemessage) {
  _log(message, safemessage, console.info);
}

function warn(message, safemessage) {
  _log(message, safemessage, console.warn);
}

function error(message, safemessage) {
  _log(message, safemessage, console.error);
}
