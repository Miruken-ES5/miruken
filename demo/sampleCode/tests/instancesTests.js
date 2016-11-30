new function(){

  eval(base2.instances.namespace)

  describe("instances", () => {
    it("should export a Logger", () => {
      Logger.should.not.be.nothing;
    });

    describe("alert logger instance", () => {
      it("should now have alert capability", () => {
        let myLogger = new Logger("console");
        let alertLogger = new Logger("alert");

        alertLogger.extend({
          alert: function(message) {
            alert(message);
          }
        });

        myLogger.hasOwnProperty("alert").should.be.false;
        alertLogger.hasOwnProperty("alert").should.be.true;
      });
    });
  });

}