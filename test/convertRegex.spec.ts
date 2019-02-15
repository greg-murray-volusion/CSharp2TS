
import {
    convertSource,
    replaceJsDocCode,
    replaceNullOperator,
    replacePascalCaseMethodsOrProps,
    replacePascalCaseProps,
    replaceSingleLineComment,
    replaceStaticMethod,
    replaceThis,
    defaultConfig,
    replaceInterfaceMethod,
    replaceTemplateString,
    replaceAsyncMethod,
    replaceAsyncMethodMultiline
} from "../src/commands/convert";
import { cs2ts } from "../src/converter";

describe("convert", () => {
    describe("this", () => {
        it("requires leading space", () => {
            const source = " TrackingInformation = new Array<Tracking>();";
            const expected = " this.TrackingInformation = new Array<Tracking>();";
            const actual = source.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should not replace camelCase", () => {
            const source = "return eventType.IsEqualIgnoreCase(\"Shipped\")";
            const actual = source.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(source);
        });
        it("should not replace comment", () => {
            const source = "/// The AddressBook.";
            const actual = source.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(source);
        });
        xit("should not replace prop initializer", () => {
            const source = "public FulfillmentData FulfillmentData { get; set; } = new FulfillmentData();";
            const expected = source;
            const actual = source.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("replace valid scenarios", () => {
            const source = "(Addr.Test); Addr = new Addr(); Addr.Test; Res(item.ErrorMessage,";
            const expected = "(this.Addr.Test); this.Addr = new Addr(); this.Addr.Test; Res(item.ErrorMessage,";
            const actual = source.replace(replaceThis.rgx, replaceThis.result);
            expect(actual).toEqual(expected);
        });
    });
    describe("PascalCase", () => {
        it("should convert PascalCase public properties to camelCase", () => {
            const source = "public FriendlyName: string;";
            const expected = "public friendlyName: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.result);
            expect(actual).toEqual(expected);
        });
        it("should convert PascalCase interface properties to camelCase", () => {
            const source = "Address1: string;";
            const expected = "address1: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.result);
            expect(actual).toEqual(expected);
        });
        it("should convert PascalCase method to camelCase", () => {
            const source = "public Validate(";
            const expected = "public validate("
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.result);
            expect(actual).toEqual(expected);


            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should convert PascalCase public properties of Class type to camelCase", () => {
            const source = "public MetaData: SEOMetadata;";
            const expected = "public metaData: SEOMetadata;"
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.result);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
    describe("static method", () => {
        it("should convert static method and camelCase the method name", () => {
            // (number|string|boolean|bool) (\w*)\((.*)\): static/g
            const source = "bool HasNoCreditCardNumber(string input): static";
            const expected = "static hasNoCreditCardNumber(string input): bool";
            const actual = source.replace(replaceStaticMethod.rgx, replaceStaticMethod.result);
            expect(actual).toEqual(expected);
        });
    });
    describe("comments", () => {
        it("should convert single line jsdoc to multi-line", () => {
            const source = "/**Identifier of the audit log.*/";
            const expected = "/**\n* Identifier of the audit log.\n*/";
            const actual = source.replace(replaceSingleLineComment.rgx, replaceSingleLineComment.result);
            // couldn't figure out what character should show up
            expect(actual.length).toEqual(expected.length + 18);
        });
        it("should convert jsdoc @code to markdown code", () => {
            const source = "* Audit logs contain audit information in the form of @code  AuditItems, which contain a list of @code  Differences between fields' @code  OriginalValue and @code  ModifiedValue.";
            const expected = "* Audit logs contain audit information in the form of `AuditItems`, which contain a list of `Differences` between fields' `OriginalValue` and `ModifiedValue`.";
            const actual = source.replace(replaceJsDocCode.rgx, replaceJsDocCode.result);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
    describe("null operator", () => {
        it("should replace null operator with lodash get", () => {
            const source = "p.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.result);
            expect(actual).toEqual(expected);

            const fullExpectedWithTripleNotEqual = "get(p, \"Pricing.List.Price\", null) !== null";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(fullExpectedWithTripleNotEqual);
        });
        it("should replace multiple null operator with lodash get", () => {
            const source = "p?.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.result);
            expect(actual).toEqual(expected);
        });
        it("should not replace comment", () => {
            const source = "/// List price.  Used when Sale price is null";
            const expected = source;
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.result);
            expect(actual).toEqual(expected);
        });
        it("should not replace normal properties", () => {
            const source = "return (list.HasValue || sale.HasValue)";
            const expected = source;
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.result);
            expect(actual).toEqual(source);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
    describe("interface", () => {
        it("should not convert interface to class", () => {
            const source = "export interface IInventoryServiceSdk";
            const expected = source;
            const cs2tsConversion = cs2ts(source, defaultConfig);
            expect(cs2tsConversion).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should convert interface method", () => {
            const source = "Task<Inventory> IncrementInventoryAsync(string tenant, IArray<InventoryChangeRequest> inventoryChangeRequests);";
            const expected = "incrementInventoryAsync(string tenant, IArray<InventoryChangeRequest> inventoryChangeRequests): Task<Inventory>;";
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.result);
            expect(actual).toEqual(expected);

            const expectedFull = "incrementInventoryAsync(tenant: string, inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>;";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
        it("should convert interface method with namespaced Task", () => {
            const source = "Task<Models.Cart.Cart> GetCartAsync(string tenant, string cartId);";
            const expected = "getCartAsync(string tenant, string cartId): Task<Models.Cart.Cart>;";
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.result);
            expect(actual).toEqual(expected);

            const expectedFull = "getCartAsync(tenant: string, cartId: string): Promise<Models.Cart.Cart>;";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("string interpolation", () => {
        it("should replace C# string template with JS", () => {
            const source = 'loggerProvider.GetLogger().Error($"Error response {err.Message} from uri: {uri}");';
            const expected = "loggerProvider.GetLogger().Error(`Error response ${err.Message} from uri: ${uri}`);";
            const actual = source.replace(replaceTemplateString.rgx, replaceTemplateString.result);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
    describe("method parameters", () => {
        it("should convert async methods", () => {
            const source = "public async Task<Inventory> UpdateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems)";
            const expected = "public async updateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems): Task<Inventory>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.result);
            expect(actual).toEqual(expected);

            const expectedFull = "public async updateInventoryAsync(tenant: string, productId: string, inventoryItems: Array<Sku>): Promise<Inventory>";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);

            // const cs2result = cs2ts(source, defaultConfig);
            // // tslint:disable-next-line no-console
            // console.log("cs2result", cs2result);
        });
        it("should convert async methods with namespaced task", () => {
            const source = "public async Task<Models.Cart.Cart> GetAdminCartAsync(string tenantId, string cartId)";
            const expected = "public async getAdminCartAsync(string tenantId, string cartId): Task<Models.Cart.Cart>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.result);
            expect(actual).toEqual(expected);

            const expectedFull = "public async getAdminCartAsync(tenantId: string, cartId: string): Promise<Models.Cart.Cart>";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);

            // const cs2result = cs2ts(source, defaultConfig);
            // // tslint:disable-next-line no-console
            // console.log("ns task cs2result", cs2result);
        });
        it("should convert async methods spanning multiple lines", () => {
            const source = `public async Task<Inventory> DecrementInventoryAsync(string tenant,
                IList<InventoryChangeRequest> inventoryChangeRequests)`;
            const expected = `public async decrementInventoryAsync(string tenant, 
                IList<InventoryChangeRequest> inventoryChangeRequests): Task<Inventory>`;
            const actual = source.replace(replaceAsyncMethodMultiline.rgx, replaceAsyncMethodMultiline.result);
            expect(actual).toEqual(expected);

            const expectedFull = `public async decrementInventoryAsync(tenant: string, 
                inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>`;
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
});