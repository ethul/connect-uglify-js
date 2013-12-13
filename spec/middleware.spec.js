var fs = require("fs")
  , path = require("path")
  , request = require("request")
  , connect = require("connect")
  , http = require("http")
  , middleware = require("../lib/middleware")
  , memory = require("../lib/memory-strategy");

describe("when the uglify-js middleware is used by connect", function() {
  beforeEach(function() {
    this.root = __dirname + "/assets/javascripts";
    this.encoding = "utf8";
    this.memory = {};
    this.strategy = memory(this.memory);
  });

  beforeEach(function() {
    var port = 12341;
    this.uri = "http://localhost:" + port;
    this.connect = connect();
    this.connect.use(middleware(this.root,{
      encoding: this.encoding,
      strategy: this.strategy
    }));
    this.server = http.createServer(this.connect).listen(port);
  });

  beforeEach(function() {
    this.javascript = [
        "function foo() {"
      , "  return 10;"
      , "}"
      , ""
      , "function bar() {"
      , "  return 12;"
      , "}"
    ].join("\n");
    this.uglified = "function foo(){return 10}function bar(){return 12}";
  });

  beforeEach(function() {
    this.malformatted = [
        "function foo() {"
      , "  return 10;"
      , "}"
      , ""
      , "bar) {"
      , "  return 12;"
    ].join("\n");
  });

  afterEach(function() {
    this.server.close();
  });

  describe("when an existing javascript file is requested with a GET", function() {
    beforeEach(function() {
      var javascript = this.javascript;
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(true);});
      this.readFileSpy = spyOn(fs,"readFile").andCallFake(function(file,encoding,callback){callback(false,javascript);});
    });
    beforeEach(function() {
      this.pathname = "/abc/xyz/existing.js";
    });
    it("should respond with an HTTP 200 status", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(200);
      });
    });
    it("should respond with the text/javascript content type", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-type"]).toEqual("application/javascript");
      });
    });
    it("should respond with the length of the uglified javascript as content length", function() {
      var expected = this.uglified.length.toString();
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-length"]).toEqual(expected);
      });
    });
    it("should respond with the uglified javascript file request", function() {
      var expected = this.uglified;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(body).toEqual(expected);
      });
    });
    it("should invoke path.exists with the root path prefixed to the pathname", function() {
      var spy = this.existsSpy
        , expected = this.root + this.pathname
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
        expect(spy.mostRecentCall.args[0]).toEqual(expected);
      });
    });
    it("should invoke fs.readFile with the root path prefixed to the pathname", function() {
      var spy = this.readFileSpy
        , expected = this.root + this.pathname
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
        expect(spy.mostRecentCall.args[0]).toEqual(expected);
      });
    });
    it("should invoke fs.readFile with the specified encoding", function() {
      var spy = this.readFileSpy
        , expected = this.encoding;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
        expect(spy.mostRecentCall.args[1]).toEqual(expected);
      });
    });
  });

  describe("when an existing javascript file is requested with a HEAD", function() {
    beforeEach(function() {
      var javascript = this.javascript;
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(true);});
      this.readFileSpy = spyOn(fs,"readFile").andCallFake(function(file,encoding,callback){callback(false,javascript);});
    });
    beforeEach(function() {
      this.pathname = "/abc/xyz/existing.js";
    });
    it("should respond with an HTTP 200 status", function() {
      head(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(200);
      });
    });
    it("should respond with the text/javascript content type", function() {
      head(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-type"]).toEqual("application/javascript");
      });
    });
    it("should respond with the length of the uglified javascript as content length", function() {
      var expected = this.uglified.length.toString();
      head(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-length"]).toEqual(expected);
      });
    });
    it("should respond with an empty body", function() {
      head(this.uri + this.pathname, function(error,response,body) {
        expect(body).toEqual('');
      });
    });
  });

  describe("when an existing javascript file is requested that is memory with a GET", function() {
    beforeEach(function() {
      var javascript = this.javascript;
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(true);});
      this.readFileSpy = spyOn(fs,"readFile").andCallFake(function(file,encoding,callback){callback(false,javascript);});
    });
    beforeEach(function() {
      this.pathname = "/abc/xyz/inmemory.js";
      this.memory[this.root + this.pathname] = this.uglified;
    });
    it("should respond with an HTTP 200 status", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(200);
      });
    });
    it("should respond with the text/javascript content type", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-type"]).toEqual("application/javascript");
      });
    });
    it("should respond with the length of the uglified javascript as content length", function() {
      var expected = this.uglified.length.toString();
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.headers["content-length"]).toEqual(expected);
      });
    });
    it("should respond with the uglified javascript file request", function() {
      var expected = this.uglified;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(body).toEqual(expected);
      });
    });
    it("should not call exists on the path", function() {
      var spy = this.existsSpy;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).not.toHaveBeenCalled();
      });
    });
    it("should not call read on the fs", function() {
      var spy = this.readFileSpy;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe("when a non-existing javascript file is requested", function() {
    beforeEach(function() {
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(false);});
    });
    beforeEach(function() {
      this.pathname = "/abc/xyz/non-existing.js";
    });
    it("should respond with an HTTP 404 status", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(404);
      });
    });
    it("should respond with a not found body", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(body).toEqual("Not Found");
      });
    });
    it("should invoke path.exists with the root path prefixed to the pathname", function() {
      var spy = this.existsSpy
        , expected = this.root + this.pathname
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
        expect(spy.mostRecentCall.args[0]).toEqual(expected);
      });
    });
  });

  describe("when a file that is not javascript is requested", function() {
    beforeEach(function() {
      var middlewareStub = function(request,response,next){response.end();};
      this.middlewareSpy = jasmine.createSpy("middleware").andCallFake(middlewareStub);
      this.connect.use(this.middlewareSpy);
    });
    beforeEach(function() {
      this.pathname = "/abc/xyz/a.css";
    });
    it("should ignore the request invoking the next middleware", function() {
      var spy = this.middlewareSpy;
      get(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
  describe("when uglify-js fails to uglify the javascript", function() {
    beforeEach(function() {
      var javascript = this.malformatted;
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(true);});
      this.readFileSpy = spyOn(fs,"readFile").andCallFake(function(file,encoding,callback){callback(false,javascript);});
      this.pathname = "/abc/xyz/malformatted.js";
    });
    it("should respond with an HTTP 500 status", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(500);
      });
    });
  });
  describe("when the javascript file cannot be read", function() {
    beforeEach(function() {
      var error = "cannot be read";
      this.existsSpy = spyOn(path,"exists").andCallFake(function(file,callback){callback(true);});
      this.readFileSpy = spyOn(fs,"readFile").andCallFake(function(file,encoding,callback){callback(error,null);});
      this.pathname = "/abc/xyz/cannotberead.js";
    });
    it("should respond with an HTTP 500 status", function() {
      get(this.uri + this.pathname, function(error,response,body) {
        expect(response.statusCode).toEqual(500);
      });
    });
  });
  describe("when the request is not an http GET request", function() {
    beforeEach(function() {
      var middlewareStub = function(request,response,next){response.end();};
      this.middlewareSpy = jasmine.createSpy("middleware").andCallFake(middlewareStub);
      this.connect.use(this.middlewareSpy);
      this.pathname = "/abc/xyz/post.js";
    });
    it("should ignore the request invoking the next middleware", function() {
      var spy = this.middlewareSpy;
      post(this.uri + this.pathname, function(error,response,body) {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
  describe("when the request is malicious", function() {
    beforeEach(function() {
      var middlewareStub = function(request,response,next){response.end();};
      this.middlewareSpy = jasmine.createSpy("middleware").andCallFake(middlewareStub);
      this.connect.use(this.middlewareSpy);
    });
    describe("when the request path escapes the root path", function() {
      beforeEach(function() {
        this.pathname = "/abc/../../../../../xyz/escaper.js";
      });
      it("should ignore the request", function() {
        var spy = this.middlewareSpy;
        get(this.uri + this.pathname, function(error,response,body) {
          expect(spy).toHaveBeenCalled();
        });
      });
    });
    describe("when the request path is a sibling with the same prefix as the root path", function() {
      beforeEach(function() {
        this.pathname = "/abc/../../javascripts_two/escaper.js";
      });
      it("should ignore the request", function() {
        var spy = this.middlewareSpy;
        get(this.uri + this.pathname, function(error,response,body) {
          expect(spy).toHaveBeenCalled();
        });
      });
    });
  });
});

describe("when a root is not provided to the uglify-js middleware", function() {
  it("should throw an error indicating the root is missing or invalid", function() {
    expect(function(){middleware("");}).toThrow(new Error("Invalid root path: "));
    expect(function(){middleware(undefined);}).toThrow(new Error("Invalid root path: undefined"));
    expect(function(){middleware(null);}).toThrow(new Error("Invalid root path: null"));
  });
});

function head(uri,callback) {
  request.head({uri: uri},function(error,response,body) {
    callback(error,response,body);
    asyncSpecDone();
  });
  asyncSpecWait();
}

function get(uri,callback) {
  request.get({uri: uri},function(error,response,body) {
    callback(error,response,body);
    asyncSpecDone();
  });
  asyncSpecWait();
}

function post(uri,callback) {
  request.post({uri: uri},function(error,response,body) {
    callback(error,response,body);
    asyncSpecDone();
  });
  asyncSpecWait();
}
