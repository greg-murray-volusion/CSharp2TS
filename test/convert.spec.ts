// import expect from "jest";
import { replaceThis } from "../src/commands/convert";


describe("convert", () => {
    describe("this", () => {

        it("requires leading space", () => {
            const target = " TrackingInformation = new Array<Tracking>();";
            const actual = target.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(" this.TrackingInformation = new Array<Tracking>();");
        });
        it("should not replace camelCase", () => {
            const target = "return eventType.IsEqualIgnoreCase(\"Shipped\")";
            const actual = target.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(target);
        });
        it("replace valid scenarios", () => {
            const input = "(Addr.Test); Addr = new Addr(); Addr.Test; Res(item.ErrorMessage,";
            const expected = "(this.Addr.Test); this.Addr = new Addr(); this.Addr.Test; Res(item.ErrorMessage,";
            const actual = input.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(expected);
        });
    });
});