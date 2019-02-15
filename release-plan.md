# Release Plan / To do list

1. object init:

    ```csharp
    new Pricing {ListPrice = list, SalePrice = sale}
    ```

1. Utility
    - jsdoc li ul remark
    - IsEqualIgnoreCase  (extension)
    - string.isNullOrEmpty
    - sum
1. casting
1. get extra brace

```csharp
// get property
private number CalculatedSubTotal { get { return this.Items.Sum(x => x.SubTotal); } }

// casting
return (number) TotalItems;

// string methods
string.IsNullOrWhiteSpace(phoneNumber))
countryToValidate.ToLowerInvariant();

// LINQ
return this.Items.Sum(x => x.Quantity);

// a couple of options:

// lodash
sumBy(this.Items, x => x.Quantity);

// es6
this.Items.reduce((acc, x) => acc + x.Quantity);

```
