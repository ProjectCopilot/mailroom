/**
  * Project Copilot Prioritize Module
  * Prioritize a list of given elements based on certain features within the data
  * Used to measure urgency of certain requests for volunteers to handle sooner than later
*/

exports = module.exports = {};

exports.sort = (l) => {
  let sorted = l.slice();
  sorted = sorted.sort((a, b) =>
    new Date(a.time_submitted).getTime() - new Date(b.time_submitted).getTime()
  );
  return sorted;
};

