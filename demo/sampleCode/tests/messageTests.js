import messages from "messages";

describe("message module", () => {
    it("should have hello world message", () => {
        messages.hello.should.be.equal("Hello World!");
    });
});


