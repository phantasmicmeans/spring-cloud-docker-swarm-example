describe("HystrixSSEStream", function () {
    it("should not load with missing dependencies", () => {
        expect(() => require("../../lib/http/HystrixSSEStream"))
            .toThrow(new Error("HystrixSSEStream requires either rx@>=3.0.0 or rxjs@^5.0.0"));
    });
});
