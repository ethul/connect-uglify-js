var curry = require("bassline").curry;

module.exports = function(memory) {
  memory = memory || {};

  // Allows for a value to be placed into the memory at the given key if
  // the caller so choses to do so.
  function reserver(key,value) {memory[key] = value; return value;}

  return Object.create({
    get: function(onget,onelse,key) {
      if (key in memory) onget(memory[key]);
      else onelse(curry(reserver)(key),key);
    }
  });
};
