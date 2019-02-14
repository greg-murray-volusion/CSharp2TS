import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { cs2ts } from "../converter";
import { ExtensionConfig } from "../config";

const defaultConfig: ExtensionConfig = {
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
    classToInterface: true,
    preserveModifiers: false
};

const recursiveScan = (dir: string): string[] =>
  readdirSync(dir)
    .reduce((files: string[], file: string) =>
      statSync(join(dir, file)).isDirectory() ?
        files.concat(recursiveScan(join(dir, file))) :
        files.concat(file.endsWith(".cs") ? join(dir, file): []),
      []);

const toCamelCase = s => s && s.length > 0 ? s.substring(0,1).toLowerCase() +  s.substring(1) : "";

export const convertFile = (csFileName: string): void => {
  const regexUsing = /using .*/g;
  const regexNs = /namespace .*[^]*?{/;
  const csCode = readFileSync(csFileName).toString();
  const hasMethod = csCode.indexOf("(") !== -1;
  const config = hasMethod
    ? { ...defaultConfig, ...{ classToInterface: false, preserveModifiers: true}}
    : defaultConfig;
  const strippedUsing = csCode.replace(regexUsing, "").trim();
  const hasNamespace = regexNs.test(strippedUsing);
  const strippedNs = strippedUsing.replace(regexNs, "").trim();
  const cleanedCsCode = hasNamespace
    ? strippedNs.substring(0, 
        strippedNs.lastIndexOf("}"))
                  .concat(
                    strippedNs.substring(strippedNs.lastIndexOf("}") + 1)
                  ).trim()
    : strippedNs;
  // perhaps strip off imports and namespaces here?
  const tsCode = cs2ts(cleanedCsCode, config);
  const cleanTsCode = tsCode
                        .replace(/(decimal|float|double|long|int )[?]*/g, "number")
                        .replace(/ bool /g, " boolean ")
                        .replace(/var /g, "const ")
                        // new List<List<string>>() -> new Array<Array<string>>();
                        .replace(/List</g, "Array<")
                        .replace(/(?<=\d)(m){1}/g, "")
                        // xs.Count() -> xs.length
                        .replace(/\.Count\(\)/g, ".length")
                        // s.Replace("-", "") || s.StartsWith("T") -> s.replace("-", "") || s.startsWith("T")
                        .replace(/(Replace|StartsWith|EndsWith)\(/g, toCamelCase)
                        // c.ToLowerInvariant() || c.ToLower() -> c.toLowerCase() || c.toLowerCase()
                        .replace(/\.ToLower(Invariant)?\(\)/g, ".toLowerCase()")
                        .replace(/string.IsNullOr(WhiteSpace|Empty)?\(/g, "isEmpty(")
                        // obj?.prop -> obj!.prop   // valid ts but need to convert to lodash get
                        .replace(/\?\./g, "!.")
                        // check for null t ?? s -> t || s
                        .replace(/[?]{2}/g, "||")
                        .replace(/\$"/g, "`")
                        // need to combine with above
                        .replace(/}";/g, "`;")
                        .replace(/(\w*): const = /g, "const $1 = ")
                        .replace(/foreach \(const (\w*) in ([\w.]*)\)/g, "for (let $1 in $2)")
                        .replace(/(?:\()([A-Z]{1}[a-z]+[A-Za-z0-9_.]*)/g, "(this.$1")
                        .replace(/(?:\s)([A-Z]{1}[a-z]+[!.]+[A-Za-z0-9_.]*)/g, " this.$1")
                        .replace(/\/\*\*\/\/\/\s+\*\//g, "")
                        .replace(/export (number|string|boolean|float)[?]* (\w*) {\s+get/g, "get $2(): $1")
                        // cs2ts is incorrectly converting
                        // public static bool IsUS(string country)
                        // boolean IsUS(string country): static {
                        // so have to fix it -> static IsUS(country: string): boolean
                        .replace(/(number|string|boolean|bool) (\w*)\((.*)\): static/g, "static $2($3): $1")
                        .replace(/(public|private|protected) static (number|string|boolean|bool) (\w*)\((.*)\)/g, "$1 static $3($4): $2")
                        .replace(/(public|private|protected) (number|string|boolean) (\w*) \{ get {(.*)\}$/g, "$1 get $3(): $2 { $4")
                        .replace(/(public|private|protected) (number|string|boolean) (\w*)\((.*)\)/g, "$1 $3($4): $2")
                        .replace(/(public|private|protected) (\w*)[:] (\w*) = > (.*)/g, "$1 get $2(): $3 { return $4 }")
                        // (number total, string temp, -> (total: number, temp: string
                        .replace(/(number|string|boolean) (\w*),/g, "$2: $1,")
                        // boolean flag) -> flag: boolean)
                        .replace(/(number|string|boolean) (\w*)\)/g, "$2: $1)")
                        // null: return; -> return null;
                        .replace(/(\w*):+\s*return/g, "return $1")
                        // fix error and convert to triple equals
                        .replace(/( = = | == )/g, " === ");
                        
  const tsFileName = csFileName.replace(".cs", ".ts");
  // tslint:disable-next-line no-console
  console.log(`writing ${tsFileName}`);
  writeFileSync(tsFileName, cleanTsCode, "utf8");
}

export const convertDirectory = (directory: string): void => {
    const recFiles = recursiveScan(directory);
    recFiles.forEach(convertFile);
}