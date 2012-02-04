module.exports = function() {
  var memory = {};
  return Object.create({
    getOrElse: function(key,callback) {
      console.log("getting or elsing");
    },
    put: function(key,value) {
      console.log("putting");
    }
  });
};
