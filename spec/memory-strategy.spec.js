var strategy = require("../lib/memory-strategy");

describe("when the memory strategy is used", function() {
  beforeEach(function() {
    this.memory = {};
    this.strategy = strategy(this.memory);
  });

  describe("when the key is not in the memory and the reserver is invoked", function() {
    it("should update the memory with the value at the give key", function() {
      var memory = this.memory
        , key = "notthere"
        , val = "value";
      this.strategy.get(function(v){},function(r,k){
        expect(r(val)).toEqual(val);
        expect(k).toEqual(key);
      },key);
      expect(memory[key]).toEqual(val);
    });
  });

  describe("when the key is not in the memory and the reserver is not invoked", function() {
    it("should not update the memory", function() {
      var memory = this.memory
        , key = "notthere";
      this.strategy.get(function(v){},function(r){},key);
      expect(memory).toEqual({});
    });
  });

  describe("when the key is in the memory", function() {
    it("should be passed to the onget function", function() {
      var key = "notthere", val = "value", that = this;
      this.memory[key] = val;
      this.strategy.get(function(v){
        expect(v).toEqual(val);
      },function(r){that.fail(new Error("should not be here"));},key);
    });
  });
});
