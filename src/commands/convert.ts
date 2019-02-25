import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { cs2ts } from "../converter";
import { ExtensionConfig } from "../config";

export const defaultConfig: ExtensionConfig = {
  propertiesToCamelCase: false,
  trimPostfixes: [],
  recursiveTrimPostfixes: false,
  ignoreInitializer: false,
  removeMethodBodies: false,
  removeConstructors: false,
  methodStyle: "signature",
  byteArrayToString: true,
  dateToDateOrString: true,
  removeWithModifier: [],
  removeNameRegex: "",
  classToInterface: false,
  preserveModifiers: true
};

const toCamelCase = s => s && s.length > 0 ? s.substring(0, 1).toLowerCase() + s.substring(1) : "";

interface Replacement {
  rgx: RegExp;
  transform: string;
};
interface ReplacementFn {
  rgx: RegExp;
  transform: (match: string, p1: string, ...rest: string[]) => string;
};

export const replaceNullOperator: ReplacementFn = {
  rgx: /(\w*)[?]?\.((\w*\?\.\w*)+) /g,
  transform: (match: string, p1: string, p2: string) => `get(${p1}, \"${p2.replace(/[?]/g, "")}\", null) `
};
export const replacePascalCaseProps: ReplacementFn = {
  rgx: /(\w*): (number|string|boolean|Date)/g,
  transform: (match: string, p1: string, p2: string) => `${toCamelCase(p1)}: ${p2}`
};
export const replacePascalCaseMethodsOrProps: ReplacementFn = {
  rgx: /(public|private|protected) (\w*)(\(|:)/g,
  transform: (match: string, p1: string, p2: string, p3: string) => `${p1} ${toCamelCase(p2)}${p3}`
};
// cs2ts has already incorrectly converted method
export const replaceStaticMethod: ReplacementFn = {
  rgx: /(number|string|boolean|\w*\<[^>]*\>) (\w*)\((.*)\): static/g,
  transform: (match: string, p1: string, p2: string, p3: string) => `public static ${toCamelCase(p2)}(${p3}): ${p1}`
};
export const replaceInterfaceMethod: ReplacementFn = {
  rgx: /(number|string|boolean|\w*\<[^>]*\>) (\w*)\((.*)\);/g,
  transform: (match: string, p1: string, p2: string, p3: string) => `${toCamelCase(p2)}(${p3}): ${p1};`
};
export const replaceAsyncMethod: ReplacementFn = {
  rgx: /(public|private|protected) async (number|string|boolean|\w*\<[^>]*\>\>?) (\w*)\((.*)\)/g,
  transform: (match: string, p1: string, p2: string, p3: string, p4: string) =>
    `${p1} async ${toCamelCase(p3)}(${p4}): ${p2}`
};
export const replaceAsyncMethodMultiline: ReplacementFn = {
  rgx: /(public|private|protected) async (number|string|boolean|\w*\<[^>]*\>\>?) (\w*)\((.*)+(\s.*)?\)/g,
  transform: (match: string, p1: string, p2: string, p3: string, p4: string, p5: string) =>
    `${p1} async ${toCamelCase(p3)}(${p4}${p5 ? " " + p5 : ""}): ${p2}`
};
export const replaceMethodParameters: Replacement = {
  rgx: /(number|string|boolean|[A-Z]+[a-z0-9]*|\w*\<[^>]*\>\>?) (\w*)(,|\)| = \w*)/g,
  transform: "$2: $1$3"
};
// not using global replace as should be only 1 test fixture per file
export const replaceTestFixtureClass: ReplacementFn = {
  rgx: /\[TestFixture\]\s+public class (\w*)\s+\{/,
  transform: (match: string, p1: string) => `describe("${p1.replace(/(?<=[a-z])(?=[A-Z])/g, " ")}", () => {`
};
export const replaceTestMethod: ReplacementFn = {
  rgx: /\[Test\]\s+public void (\w*)\(\)\s+\{/g,
  transform: (match: string, p1: string) => `it("${p1.replace(/(?<=[a-z])(?=[A-Z])/g, " ")}", () => {`
};
export const replaceTemplateString: ReplacementFn = {
  rgx: /\$"(.*)"/g,
  transform: (match: string, p1: string) => `\`${p1.replace(/{/g, "${")}\``
};
// null: return; -> return null;
export const replaceMistakeOnReturn: Replacement = {
  rgx: /(\w*): *return/g,
  transform: "return $1"
};
export const replaceSingleLineComment: Replacement = {
  rgx: /(\/\*\*)([^*]*)(\*\/)/g,
  transform: "$1\n         * $2\n         $3"
};
export const replaceJsDocCode: Replacement = {
  rgx: /(@code\s+(\w+))/g,
  transform: "`$2`"
};
export const replaceJsDocList: Replacement = {
  rgx: /(@ul|@li)/g,
  transform: "-"
};

const recursiveScan = (dir: string): string[] =>
  readdirSync(dir)
    .reduce((files: string[], file: string) =>
      statSync(join(dir, file)).isDirectory() ?
        files.concat(recursiveScan(join(dir, file))) :
        files.concat(file.endsWith(".cs") ? join(dir, file) : []),
      []);

export const postCleanup = (tsCode: string): string =>
  tsCode
    .replace(/(decimal|float|double|long|uint|int )[?]*/g, "number")
    .replace(/ bool[?]? /g, " boolean ")
    .replace(/var /g, "const ")
    // new List<List<string>>() -> new Array<Array<string>>();
    .replace(/([I]?List|IArray|IEnumerable)</g, "Array<")
    .replace(/Task</g, "Promise<")
    .replace(/ Task /g, " Promise<void> ")
    .replace(/(?<=\d)(m){1}/g, "")
    // xs.Count() -> xs.length
    .replace(/\.Count(\(\)|[,])/g, ".length")
    .replace(/\.Contains\(/g, ".includes(")
    .replace(/\.Substring\(/g, ".substring(")
    .replace(/\.AddRange\(/g, ".concat(")
    .replace(/DateTime.Now/g, "new Date()")
    .replace(/Assert.That/g, "expect")
    // LINQ methods
    .replace(/\.Any\(/g, ".some(")
    .replace(/\.Where\(/g, ".filter(")
    .replace(/\.FirstOrDefault\(/g, ".find(")
    .replace(/\.Select\(/g, ".map(")
    .replace(/\.ToList\(\)/g, "")
    // s.Replace("-", "") || s.StartsWith("T") -> s.replace("-", "") || s.startsWith("T")
    .replace(/(Replace|StartsWith|EndsWith)\(/g, toCamelCase)
    // c.ToLowerInvariant() || c.ToLower() -> c.toLowerCase() || c.toLowerCase()
    .replace(/\.ToLower(Invariant)?\(\)/g, ".toLowerCase()")
    .replace(/[sS]tring.IsNullOr(WhiteSpace|Empty)+\(/g, "String.isNullOr$1(")
    // obj.obj?.prop -> obj!.prop
    .replace(replaceNullOperator.rgx, replaceNullOperator.transform)
    // check for null t ?? s -> t || s
    .replace(/[?]{2}/g, "||")
    .replace(replaceTemplateString.rgx, replaceTemplateString.transform)
    .replace(/(\w*): const = /g, "const $1 = ")
    .replace(/foreach \(const (\w*) in ([\w.]*)\)/g, "for (const $1 of $2)")
    .replace(replacePascalCaseProps.rgx, replacePascalCaseProps.transform)
    // empty jsdoc comment
    .replace(/\/\*\*\/\/\/\s+\*\//g, "")
    .replace(/(\#region(.*)|\#endregion(.*))/g, "// $1")
    .replace(replaceJsDocCode.rgx, replaceJsDocCode.transform)
    .replace(replaceJsDocList.rgx, replaceJsDocList.transform)
    .replace(replaceSingleLineComment.rgx, replaceSingleLineComment.transform)
    .replace(/export (number|string|boolean|\w*\<[^>]*\>\>?)[?]* (\w*) {\s+get/g, "get $2(): $1")
    // cs2ts is incorrectly converting
    // public static bool IsUS(string country)
    // boolean IsUS(string country): static {
    // so have to fix it -> static IsUS(country: string): boolean
    .replace(replaceStaticMethod.rgx, replaceStaticMethod.transform)
    // .replace(/(number|string|boolean) (\w*)\((.*)\): static/g, "static $2($3): $1")
    // .replace(/(public|private|protected) static (number|string|boolean|\w*\<[^>]*\>\>?) (\w*)\((.*)\)/g, "$1 static $3($4): $2")
    .replace(/(public|private|protected) (number|string|boolean|\w*\<[^>]*\>\>?) (\w*) \{ get {(.*)\}$/g, "$1 get $3(): $2 { $4")
    .replace(/(public|private|protected) (number|string|boolean|\w*\<[^>]*\>\>?) (\w*)\((.*)\)/g, "$1 $3($4): $2")
    // fix for broken arrow function
    .replace(/(public|private|protected) (\w*)[:] (\w*) = > (.*)/g, "$1 get $2(): $3 { return $4 }")
    .replace(replaceAsyncMethod.rgx, replaceAsyncMethod.transform)
    .replace(replaceAsyncMethodMultiline.rgx, replaceAsyncMethodMultiline.transform)
    .replace(replacePascalCaseMethodsOrProps.rgx, replacePascalCaseMethodsOrProps.transform)
    .replace(replaceInterfaceMethod.rgx, replaceInterfaceMethod.transform)
    .replace(replaceMethodParameters.rgx, replaceMethodParameters.transform)
    .replace(replaceMistakeOnReturn.rgx, replaceMistakeOnReturn.transform)
    // fix error and convert to triple equals
    .replace(/( = = | == )/g, " === ")
    .replace(/ != /g, " !== ")
    // replace I from interfaces
    .replace(/(extends|implements|[:]) I([A-Z])/, "$1 $2")
    .replace(/[,] I([A-Z]\w*)/g, ", $1")
    .replace(/export interface I([A-Z])/, "export interface $1");

export const convertSource = (csCode: string) => {
  const regexUsing = /using .*/g;
  const regexNs = /namespace .*\s*{/;
  const strippedUsing = csCode.replace(regexUsing, "");
  const hasNamespace = regexNs.test(strippedUsing);
  const strippedNs = strippedUsing.replace(regexNs, "");
  const cleanedCsCode = hasNamespace
    ? strippedNs.substring(0,
      strippedNs.lastIndexOf("}"))
      .concat(
        strippedNs.substring(strippedNs.lastIndexOf("}") + 1)
      ).trim()
    : strippedNs;
  const testTransform = cleanedCsCode
    .replace(replaceTestFixtureClass.rgx, replaceTestFixtureClass.transform)
    .replace(replaceTestMethod.rgx, replaceTestMethod.transform);
  const tsCode = cs2ts(testTransform, defaultConfig);
  return postCleanup(tsCode);
}

export const convertFile = (csFileName: string): void => {
  const csCode = readFileSync(csFileName).toString();
  const cleanTsCode = convertSource(csCode);
  const tsFileName = csFileName.replace(".cs", ".ts");
  // tslint:disable-next-line no-console
  console.log(`writing ${tsFileName}`);
  writeFileSync(tsFileName, cleanTsCode, "utf8");
}

export const convertDirectory = (directory: string): void => {
  const recFiles = recursiveScan(directory);
  recFiles.forEach(convertFile);
}
