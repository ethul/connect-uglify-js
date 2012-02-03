module.exports = function(options) {
  return function(request,response,next) {
    return next();
  }
}
