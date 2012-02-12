var fs = require("fs")
  , url = require("url")
  , path = require("path")
  , uglify = require("uglify-js")
  , bassline = require("bassline")
  , nothing = bassline.nothing
  , just = bassline.just
  , left = bassline.left
  , right = bassline.right
  , curry = bassline.curry
  , promise = bassline.promise
  , memory = require("./memory-strategy");

// When the extension of the file requested is not .js then go to next
// <script src="/a.js"></script>
// app.use(middleware(__dirname + "/assets/javascripts"));
// app.use(middleware(__dirname + "/public/javascripts"));
// <script src="/javascripts/a.js"></script>
// app.use(middleware(__dirname + "/public"));
// <script src="/assets/a.js"></script>
// app.use("/assets",middleware(__dirname + "/assets/javascripts"));
// app.use("/assets",middleware(__dirname + "/public/javascripts"));
exports = module.exports = function(root,options) {
  if (!validRoot(root)) throw new Error("Invalid root path: " + root);
  return function(request,response,next) {
    var config = configure(options || {});
    isMethodKnown(request).
    fmap(curry(requestedFilePath)(root)).
    bind(curry(doesEscapeRoot)(root)).
    bind(isFileKnown).
    fmap(function(file){
      doesFileExist(file,response).
      bind(curry(readFile)(config.encoding,next)).
      bind(uglifyFile).
      fold(curry(httpOk)(response,isHttpHead(request)));
    }).fold(next,function(){});
  };
};

function validRoot(root) {
  return (
    Object.prototype.toString.call(root) === "[object String]" 
    && root !== ""
  );
}

function configure(options) {
  return {
    encoding: options.encoding || ENCODING_UTF8,
    strategy: options.strategy || memory()
  };
}

function isMethodKnown(request) {
  if (request.method in HTTP_KNOWN_METHODS) return just(request);
  else return nothing();
}

function isFileKnown(file) {
  if (path.extname(file) === EXT_JAVASCRIPT) return just(file);
  else return nothing();
}

function requestedFilePath(root,request) {
  return path.normalize(
    path.join(root,decodeURIComponent(
      url.parse(request.url).pathname
    ))
  );
}

// The computed path for the requested file should always have the root
// as the prefix. When it does not, that means the computed request path
// is pointing outside of the root, which could be malicious.
function doesEscapeRoot(root,file) {
  if (file.indexOf(path.normalize(root+"/")) === 0) return just(file);
  else return nothing();
}

function doesFileExist(file,response) {
  return withPromise(function(promise){
    path.exists(file,function(exists) {
      if (!exists) httpNotFound(response);
      else promise.fulfill(file);
    });
  });
}

function readFile(encoding,next,file) {
  return withPromise(function(promise){
    fs.readFile(file,encoding,function(error,data) {
      if (error) next(error);
      else promise.fulfill(data);
    });
  });
}

// The uglify bin script appends a semicolon to the end of the
// processed JavaScript, out.write(text.replace(/;*$/, ";")); It is
// not clear if the middleware should also do this.
function uglifyFile(file) {
  return promise(
    uglify.uglify.gen_code(
      uglify.uglify.ast_squeeze(
        uglify.uglify.ast_mangle(uglify.parser.parse(file))
      )
    )
  );
}

// Helper method to wrap a function with a promise
function withPromise(f) {var p = promise();f(p);return p;}

// Helper method to respond with an HTTP not found
function httpNotFound(response) {
  response.statusCode = HTTP_NOT_FOUND;
  response.end(HTTP_NOT_FOUND_BODY);
}

// Helper method to response with an HTTP ok with a body, when the
// isHead is true then no body is returned
function httpOk(response,isHead,body) {
  response.setHeader(HTTP_CONTENT_TYPE,MIME_TYPE_JAVASCRIPT);
  response.setHeader(HTTP_CONTENT_LENGTH,body.length);
  response.statusCode = HTTP_OK;
  if (isHead) response.end();
  else response.end(body);
}

function isHttpHead(request) {
  return request.method === HTTP_HEAD;
}

var HTTP_CONTENT_TYPE = "Content-Type";
var HTTP_CONTENT_LENGTH = "Content-Length";
var HTTP_OK = 200;
var HTTP_NOT_FOUND = 404;
var HTTP_NOT_FOUND_BODY = "Not Found";
var HTTP_HEAD = "HEAD";
var HTTP_KNOWN_METHODS = {GET:true,HEAD:true};
var MIME_TYPE_JAVASCRIPT = "application/javascript";
var ENCODING_UTF8 = "utf8";
var EXT_JAVASCRIPT = ".js";
