/**
  * Project Copilot Prioritize Module
  * Prioritize a list of given elements based on certain features within the data
  * Used to measure urgency of certain requests for volunteers to handle sooner than later
*/

var exports = module.exports = {};

exports.sort = function(l) {
  var sorted = l.slice();
  sorted = sorted.sort(function(a, b) {
    return new Date(a.time_submitted).getTime() - new Date(b.time_submitted).getTime();
  });
  return sorted;
}
