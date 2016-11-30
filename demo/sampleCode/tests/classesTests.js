new function() {

  base2.package(this, {
    name: "classesTest",
    imports: "instrumentation"
  });

  eval(base2.instrumentation.namespace);

  describe("classes", () => {

    it("should contain a logger", () => {
      Logger.should.not.be.nothing;
    });

    it("should contain a console logger", () => {
      ConsoleLogger.should.not.be.nothing;
    });

    it("should contain a notification logger", () => {
      NotificationLogger.should.not.be.nothing;
    });
  });

};