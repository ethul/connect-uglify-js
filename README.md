# Connect-uglify-js

Connect-uglify-js is middleware for
[connect](http://www.senchalabs.org/connect/) that uses
[uglify-js](https://github.com/mishoo/UglifyJS) to compress and mangle
your JavaScript.

This middleware uses a memory caching strategy by default, which means
that once a JavaScript file has been uglified, the result is stored into
the cache, and the life of the cache is the life of the node instance.

## Installation

* Install connect-uglify-js with NPM

        npm install connect-uglify-js

## Getting Started: Express server demo

```javascript
var express = require("express")
  , uglify = require("connect-uglify-js")
  , app = module.exports = express.createServer();

app.configure(function(){
  app.set("views", __dirname + "/views");
  app.set("view engine", "jade");
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/public"));
  app.use("/assets",uglify.middleware(__dirname + "/public/javascripts"));
  app.use(app.router);
});

app.configure("development", function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure("production", function(){
  app.use(express.errorHandler()); 
});

app.get("/", function(request,response){response.render("index",{});});

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
```

Above we have added the middleware to our application mounted under
`/assets`. It is recommended to pick a mount point, otherwise the
middleware will conflict with the serving of static files.

To complete the example, we can write our HTML to request the uglified
JavaScript as follows, assuming `index.js` exists in
`__dirname/public/javascripts`.

```jade
!!! 5
head
  meta(charset="utf-8")
  title Demo
body
  h1 Demo
  script(src="/assets/index.js")
```
