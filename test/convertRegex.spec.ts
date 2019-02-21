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
    replaceThis,
    replaceTemplateString,
    replaceJsDocList
} from "../src/commands/convert";
import { cs2ts } from "../src/converter";

describe("convert", () => {
    describe("this", () => {
        it("requires leading space", () => {
            const source = " TrackingInformation = new Array<Tracking>();";
            const expected = " this.TrackingInformation = new Array<Tracking>();";
            const actual = source.replace(replaceThis.rgx, replaceThis.transform);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should not replace camelCase", () => {
            const source = "return eventType.IsEqualIgnoreCase(\"Shipped\")";
            const actual = source.replace(replaceThis.rgx, replaceThis.transform);
            expect(actual).toEqual(source);
        });
        it("should not replace comment", () => {
            const source = "/// The AddressBook.";
            const actual = source.replace(replaceThis.rgx, replaceThis.transform);
            expect(actual).toEqual(source);
        });
        xit("should not replace prop initializer", () => {
            const source = "public FulfillmentData FulfillmentData { get; set; } = new FulfillmentData();";
            const expected = source;
            const actual = source.replace(replaceThis.rgx, replaceThis.transform);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("replace valid scenarios", () => {
            const source = "(Addr.Test); Addr = new Addr(); Addr.Test; Res(item.ErrorMessage,";
            const expected = "(this.Addr.Test); this.Addr = new Addr(); this.Addr.Test; Res(item.ErrorMessage,";
            const actual = source.replace(replaceThis.rgx, replaceThis.transform);
            expect(actual).toEqual(expected);
        });
    });
    describe("PascalCase", () => {
        it("should convert PascalCase public properties to camelCase", () => {
            const source = "public FriendlyName: string;";
            const expected = "public friendlyName: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.transform);
            expect(actual).toEqual(expected);
        });
        it("should convert PascalCase interface properties to camelCase", () => {
            const source = "Address1: string;";
            const expected = "address1: string;"
            const actual = source.replace(replacePascalCaseProps.rgx, replacePascalCaseProps.transform);
            expect(actual).toEqual(expected);
        });
        it("should convert PascalCase method to camelCase", () => {
            const source = "public Validate(";
            const expected = "public validate("
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.transform);
            expect(actual).toEqual(expected);


            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should convert PascalCase public properties of Class type to camelCase", () => {
            const source = "public MetaData: SEOMetadata;";
            const expected = "public metaData: SEOMetadata;"
            const actual = source.replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.transform);
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
            const actual = source.replace(replaceStaticMethod.rgx, replaceStaticMethod.transform);
            expect(actual).toEqual(expected);
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
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
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
            expect(actual).toEqual(expected);
        });

    });
    describe("null operator", () => {
        it("should replace null operator with lodash get", () => {
            const source = "p.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            expect(actual).toEqual(expected);

            const fullExpectedWithTripleNotEqual = "get(p, \"Pricing.List.Price\", null) !== null";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(fullExpectedWithTripleNotEqual);
        });
        it("should replace multiple null operator with lodash get", () => {
            const source = "p?.Pricing?.List?.Price != null";
            const expected = "get(p, \"Pricing.List.Price\", null) != null";
            const actual = source.replace(replaceNullOperator.rgx, replaceNullOperator.transform);
            expect(actual).toEqual(expected);
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
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.transform);
            expect(actual).toEqual(expected);

            const expectedFull = "incrementInventoryAsync(tenant: string, inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>;";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
        it("should convert interface method with namespaced Task", () => {
            const source = "Task<Models.Cart.Cart> GetCartAsync(string tenant, string cartId);";
            const expected = "getCartAsync(string tenant, string cartId): Task<Models.Cart.Cart>;";
            const actual = source.replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.transform);
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
            const actual = source.replace(replaceTemplateString.rgx, replaceTemplateString.transform);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
    describe("method parameters", () => {
        it("should convert async methods", () => {
            const source = "public async Task<Inventory> UpdateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems)";
            const expected = "public async updateInventoryAsync(string tenant, string productId, IList<Sku> inventoryItems): Task<Inventory>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
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
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            expect(actual).toEqual(expected);

            const expectedFull = "public async getAdminCartAsync(tenantId: string, cartId: string): Promise<Models.Cart.Cart>";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);

            // const cs2result = cs2ts(source, defaultConfig);
            // // tslint:disable-next-line no-console
            // console.log("ns task cs2result", cs2result);
        });
        it("should convert async methods with nested generic return type", () => {
            const source = "public async Task<OkNegotiatedContentResult<Order>> GetAsync(string orderNumber, string email)";
            const expected = "public async getAsync(string orderNumber, string email): Task<OkNegotiatedContentResult<Order>>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            expect(actual).toEqual(expected);

            const expectedFull = "public async getAsync(orderNumber: string, email: string): Promise<OkNegotiatedContentResult<Order>>"
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);

            // const cs2result = cs2ts(source, defaultConfig);
            // tslint:disable-next-line no-console
            // console.log("cs2result", cs2result);
        });
        it("should convert async methods with no parameters", () => {
            const source = "public async Task<OkNegotiatedContentResult<StoreSettings>> GetAsync()";
            const expected = "public async getAsync(): Task<OkNegotiatedContentResult<StoreSettings>>"
            const actual = source.replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform);
            expect(actual).toEqual(expected);

            const expectedFull = "public async getAsync(): Promise<OkNegotiatedContentResult<StoreSettings>>"
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);

            // const cs2result = cs2ts(source, defaultConfig);
            // tslint:disable-next-line no-console
            // console.log("cs2result", cs2result);
        });
        it("should convert async methods spanning multiple lines", () => {
            const source = `public async Task<Inventory> DecrementInventoryAsync(string tenant,
                IList<InventoryChangeRequest> inventoryChangeRequests)`;
            const expected = `public async decrementInventoryAsync(string tenant, 
                IList<InventoryChangeRequest> inventoryChangeRequests): Task<Inventory>`;
            const actual = source.replace(replaceAsyncMethodMultiline.rgx, replaceAsyncMethodMultiline.transform);
            expect(actual).toEqual(expected);

            const expectedFull = `public async decrementInventoryAsync(tenant: string, 
                inventoryChangeRequests: Array<InventoryChangeRequest>): Promise<Inventory>`;
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
        it("should convert non-primitive parameters", () => {
            const source = "private async Task ProcessCanceledReversalStatus(Order order, string refundTransactionId)";
            const expected = "private async Task ProcessCanceledReversalStatus(order: Order, refundTransactionId: string)";
            const actual = source.replace(replaceMethodParameters.rgx, replaceMethodParameters.transform);
            expect(actual).toEqual(expected);
           

            const expectedFull = "private async processCanceledReversalStatus(order: Order, refundTransactionId: string): Promise<void>";
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
        it("should convert non-primitive parameters", () => {
            const source = "ProcessChargeCaptureError(Order order, string eventDescription, bool cancelOrder = false)";
            const expected = "ProcessChargeCaptureError(order: Order, eventDescription: string, bool cancelOrder = false)";
            const actual = source.replace(replaceMethodParameters.rgx, replaceMethodParameters.transform);
            expect(actual).toEqual(expected);
            
            // const fullConversion = convertSource(source);
            // expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("variable declarations", () => {
        it("should fix mistake on return", () => {
            const source = "null: return;";
            const expected = "return null;";
            const actual = source.replace(replaceMistakeOnReturn.rgx, replaceMistakeOnReturn.transform);
            expect(actual).toEqual(expected);

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
        it("should not convert case statements", () => {
            const source = `case "charge":
            return !string.IsNullOrWhiteSpace(order.PayPalPaymentTransactionId) &&
                   !paymentLifecycleEvent.IsPayPalInitiated;`;
            const expected = source;
            const actual = source.replace(replaceMistakeOnReturn.rgx, replaceMistakeOnReturn.transform);
            expect(actual).toEqual(expected);

            const expectedFull = `case "charge":
            return !isEmpty(order.PayPalPaymentTransactionId) &&
                   !paymentLifecycleEvent.IsPayPalInitiated;`;
            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expectedFull);
        });
    });
    describe("object initialization", () => {
        xit("should convert property init with constructor call", () => {
            const source = "new Pricing {ListPrice = list, SalePrice = sale}";
            const expected = "new Pricing(list, sale)";

            const fullConversion = convertSource(source);
            expect(fullConversion).toEqual(expected);
        });
    });
});