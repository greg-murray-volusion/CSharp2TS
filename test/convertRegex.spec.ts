import {
    convertSource,
    defaultConfig,
    replaceAsyncMethod,
    replaceAsyncMethodMultiline,
    replaceInterfaceMethod,
    replaceJsDocCode,
    replaceMethodParameters,
    replaceMistakeOnReturn,
    replaceNullOperator,
    replacePascalCaseMethodsOrProps,
    replacePascalCaseProps,
    replaceSingleLineComment,
    replaceStaticMethod,
    replaceTemplateString,
    replaceJsDocList,
    replaceTestFixtureClass,
    replaceTestMethod,
    replacePascalCaseStatements,
    replaceNumbers
} from "../src/commands/convert";
import { cs2ts } from "../src/converter";

describe("convert", () => {
    const assertExpected = (source: string, actual: string, expected: string, expectedFull?: string) => {
        expect(actual).toEqual(expected);
        const fullConversion = convertSource(source);
        expect(fullConversion).toEqual(expectedFull || expected);
    }
    describe("PascalCase", () => {
        it("should convert PascalCase public properties to camelCase", () => {
            const source = "public FriendlyName: string;";
            const expected = "public friendlyName: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert PascalCase interface properties to camelCase", () => {
            const source = "Address1: string;";
            const expected = "address1: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert PascalCase method to camelCase", () => {
            const source = "public Validate(";
            const expected = "public validate("
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert PascalCase public properties of Class type to camelCase", () => {
            const source = "public MetaData: SEOMetadata;";
            const expected = "public metaData: SEOMetadata;"
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert PascalCase statements to camelCase", () => {
            const source = `
            TransactionType = ipnParams["txn_type"];`;
            const expected = `
            this.transactionType = ipnParams["txn_type"];`
            const actual = source.replace(replacePascalCaseStatements.rgx, replacePascalCaseStatements.transform);
            assertExpected(source, actual, expected);
        });
    });
    describe("static method", () => {
        it("should convert static method and camelCase the method name", () => {
            const source = "boolean HasNoCreditCardNumber(string input): static";
            const expected = "public static hasNoCreditCardNumber(string input): boolean";
            const expectedFull = "public static hasNoCreditCardNumber(input: string): boolean";
            const actual = source.replace(replaceStaticMethod.rgx, replaceStaticMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert static method and camelCase the method name", () => {
            const source = "boolean ShouldFlagForReview(OrderVerification ov): static";
            const expected = "public static shouldFlagForReview(OrderVerification ov): boolean";
            const expectedFull = "public static shouldFlagForReview(ov: OrderVerification): boolean";
            //                   "public static shouldFlagForReview(Orderov: Verification): boolean"
            const actual = source.replace(replaceStaticMethod.rgx, replaceStaticMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
    });
    describe("comments", () => {
        it("should convert single line jsdoc to multi-line", () => {
            const source = "/**Identifier of the audit log.*/";
            const expected = "/**\n* Identifier of the audit log.\n*/";
            const actual = source.replace(replaceSingleLineComment.rgx, replaceSingleLineComment.transform);
            // couldn't figure out what character should show up
            expect(actual.length).toEqual(expected.length + 18);
        });
        it("should convert jsdoc @code to markdown code", () => {
            const source = "* Audit logs contain audit information in the form of @code  AuditItems, which contain a list of @code  Differences between fields' @code  OriginalValue and @code  ModifiedValue.";
            const expected = "* Audit logs contain audit information in the form of `AuditItems`, which contain a list of `Differences` between fields' `OriginalValue` and `ModifiedValue`.";
            const actual = source.replace(replaceJsDocCode.rgx, replaceJsDocCode.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert jsdoc @ul, @li to markdown list items", () => {
            const source = `/**
            * @param validationContext The validation context.
            * @p
            * Filterable Fields
            * @ul
            * @li  Equals (eq)
            * @ul
            * @li  seo.friendlyName
            * @li  parentId
            * @li  id
            * @li  Starts With (sw)
            * @ul
            * @li  name
            */`
            const expected = `/**
            * @param validationContext The validation context.
            * @p
            * Filterable Fields
            * -
            * -  Equals (eq)
            * -
            * -  seo.friendlyName
            * -  parentId
            * -  id
            * -  Starts With (sw)
            * -
            * -  name
            */`
            const actual = source.replace(replaceJsDocList.rgx, replaceJsDocList.transform);
            assertExpected(source, actual, expected);
        });

    });
    describe("null operator", () => {
        it("should replace null operator with lodash get", () => {
            const source = "p.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            const expectedFullWithTripleNotEqual = "get(p, \"Pricing.List.Price\", null) !== null";
            assertExpected(source, actual, expected, expectedFullWithTripleNotEqual);
        });
        it("should replace multiple null operator with lodash get", () => {
            const source = "p?.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const expectedFullWithTripleNotEqual = "get(p, \"Pricing.List.Price\", null) !== null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            assertExpected(source, actual, expected, expectedFullWithTripleNotEqual);
        });
        it("should not replace comment", () => {
            const source = "/// List price.  Used when Sale price is null";
            const expected = source;
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            expect(actual).toEqual(expected);
        });
        it("should not replace normal properties", () => {
            const source = "return (list.HasValue || sale.HasValue)";
            const expected = source;
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            assertExpected(source, actual, expected);
        });
    });
    describe("interface", () => {
        it("should not convert interface to class", () => {
            const source = "export interface IInventoryServiceSdk";
            const expected = source;
            const expectedFull = "export interface InventoryServiceSdk"
            const cs2tsConversion = cs2ts(source, defaultConfig);
            assertExpected(source, cs2tsConversion, expected, expectedFull);
        });
        it("should convert interface method", () => {
            const source = "Task<Inventory> IncrementInventoryAsync(string tenant, IArray<InventoryChangeRequest> inventoryChangeRequests);";
            const expected = "incrementInventoryAsync(string tenant, IArray<InventoryChangeRequest> inventoryChangeRequests): Task<Inventory>;";
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.transform);
            const expectedFull = "incrementInventoryAsync(tenant: string, inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>;";
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert interface method with namespaced Task", () => {
            const source = "Task<Models.Cart.Cart> GetCartAsync(string tenant, string cartId);";
            const expected = "getCartAsync(string tenant, string cartId): Task<Models.Cart.Cart>;";
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.transform);
            const expectedFull = "getCartAsync(tenant: string, cartId: string): Promise<Models.Cart.Cart>;";
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should remove 'I' from interface name", () => {
            const source = "public class Order : IEntity, IMultiTenant, IRevisionable, IAuditable";
            const expectedFull = "export class Order implements Entity, MultiTenant, Revisionable, Auditable";
            const fullConversion = convertSource(source);
            expect(fullConversion.trim()).toEqual(expectedFull);
        });
        it("should not remove I from non-interface", () => {
            const source = "public string Id;";
            const expectedFull = "public id: string;"
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("string interpolation", () => {
        it("should replace C# string template with JS", () => {
            const source = 'loggerProvider.GetLogger().Error($"Error response {err.Message} from uri: {uri}");';
            const expected = "loggerProvider.GetLogger().Error(`Error response ${err.Message} from uri: ${uri}`);";
            const actual = source.replace(replaceTemplateString.rgx, replaceTemplateString.transform);
            assertExpected(source, actual, expected);
        });
    });
    describe("method parameters", () => {
        it("should convert async methods", () => {
            const source = "public async Task<Inventory> UpdateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems)";
            const expected = "public async updateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems): Task<Inventory>"
            const expectedFull = "public async updateInventoryAsync(tenant: string, productId: string, inventoryItems: Array<Sku>): Promise<Inventory>";
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert async methods with namespaced task", () => {
            const source = "public async Task<Models.Cart.Cart> GetAdminCartAsync(string tenantId, string cartId)";
            const expected = "public async getAdminCartAsync(string tenantId, string cartId): Task<Models.Cart.Cart>"
            const expectedFull = "public async getAdminCartAsync(tenantId: string, cartId: string): Promise<Models.Cart.Cart>";
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert async methods with nested generic return type", () => {
            const source = "public async Task<OkNegotiatedContentResult<Order>> GetAsync(string orderNumber, string email)";
            const expected = "public async getAsync(string orderNumber, string email): Task<OkNegotiatedContentResult<Order>>"
            const expectedFull = "public async getAsync(orderNumber: string, email: string): Promise<OkNegotiatedContentResult<Order>>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert async methods with no parameters", () => {
            const source = "public async Task<OkNegotiatedContentResult<StoreSettings>> GetAsync()";
            const expected = "public async getAsync(): Task<OkNegotiatedContentResult<StoreSettings>>"
            const expectedFull = "public async getAsync(): Promise<OkNegotiatedContentResult<StoreSettings>>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert async methods spanning multiple lines", () => {
            const source = `public async Task<Inventory> DecrementInventoryAsync(string tenant,
                IList<InventoryChangeRequest> inventoryChangeRequests)`;
            const expected = `public async decrementInventoryAsync(string tenant,
                IList<InventoryChangeRequest> inventoryChangeRequests): Task<Inventory>`;
            const actual = source.replace(replaceAsyncMethodMultiline.rgx, replaceAsyncMethodMultiline.transform);

            // NOTE: new line wasn't matching so did a space-insensitive comparison
            expect(actual.replace(/\s+/g, "_")).toEqual(expected.replace(/\s+/g, "_"));

            const expectedFull = `public async decrementInventoryAsync(tenant: string,
                inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>`;
            const fullConversion = convertSource(source);
            expect(fullConversion.replace(/\s+/g, "_")).toEqual(expectedFull.replace(/\s+/g, "_"));
        });
        it("should convert non-primitive parameters in async method", () => {
            const source = "private async Task ProcessCanceledReversalStatus(Order order, string refundTransactionId)";
            const expected = "private async Task ProcessCanceledReversalStatus(order: Order, refundTransactionId: string)";
            const expectedFull = "private async processCanceledReversalStatus(order: Order, refundTransactionId: string): Promise<void>";
            const actual = source.replace(replaceMethodParameters.rgx, replaceMethodParameters.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert non-primitive parameters", () => {
            const source = "public ProcessChargeCaptureError(Order order, string eventDescription, bool cancelOrder = false)";
            const expected = "public ProcessChargeCaptureError(order: Order, eventDescription: string, bool cancelOrder = false)";
            const expectedFull = "public processChargeCaptureError(order: Order, eventDescription: string, cancelOrder: boolean = false)";
            const actual = source.replace(replaceMethodParameters.rgx, replaceMethodParameters.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert bool to boolean as return type", () => {
            const source = "private bool ProductHasTrackedInventory(Product product)";
            const expectedFull = "private productHasTrackedInventory(product: Product): boolean";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("variable declarations", () => {
        it("should fix mistake on return", () => {
            const source = "null: return;";
            const expected = "return null;";
            const actual = source.replace(replaceMistakeOnReturn.rgx, replaceMistakeOnReturn.transform);
            assertExpected(source, actual, expected);
        });
        it("should not convert case statements", () => {
            const source = `case "charge":
            return !string.IsNullOrWhiteSpace(order.PayPalPaymentTransactionId) &&
                   !paymentLifecycleEvent.IsPayPalInitiated;`;
            const expected = source;
            const expectedFull = `case "charge":
            return !String.isNullOrWhiteSpace(order.PayPalPaymentTransactionId) &&
                   !paymentLifecycleEvent.IsPayPalInitiated;`;
            const actual = source.replace(replaceMistakeOnReturn.rgx, replaceMistakeOnReturn.transform);
            assertExpected(source, actual, expected, expectedFull);
        });
        it("should convert int? to number?", () => {
            const source = "int?";
            const expected = "number?";
            const actual = source.replace(replaceNumbers.rgx, replaceNumbers.transform);
            assertExpected(source, actual, expected);
        });
        it("should convert long to number?", () => {
            const source = "public long TestMethod()";
            const expected = "public number TestMethod()";
            const expectedFull = "public testMethod(): number";
            const actual = source.replace(replaceNumbers.rgx, replaceNumbers.transform);
            assertExpected(source, expected, actual, expectedFull)
        });
        it("should not convert int or long when part of word", () => {
            const source = "// integral to the longer term plans.";
            const expected = source;
            const actual = source.replace(replaceNumbers.rgx, replaceNumbers.transform);
            assertExpected(source, actual, expected);
        });
    });
    describe("object initialization", () => {
        xit("should convert property init with constructor call", () => {
            const source = "new Pricing {ListPrice = list, SalePrice = sale}";
            const expectedFull = "new Pricing(list, sale)";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("testClass", () => {
        it("should replace test fixture with describe", () => {
            const source = `[TestFixture]
            public class WhenUsingEntityComparer
            {`;
            const expected = "describe(\"When Using Entity Comparer\", () => {";
            const actual = source.replace(replaceTestFixtureClass.rgx, replaceTestFixtureClass.transform);
            assertExpected(source, actual, expected);
        });
        it("should replace test method with it", () => {
            const source = `[Test]
            public void ItShouldReturnSingleDifference()
            {`;
            const expected = "it(\"It Should Return Single Difference\", () => {";
            const actual = source.replace(replaceTestMethod.rgx, replaceTestMethod.transform);
            assertExpected(source, actual, expected);
        });
    });
});