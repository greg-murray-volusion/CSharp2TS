#!/usr/bin/env node

import * as program from "commander";

import { convertDirectory, convertFile } from "./commands/convert";

program
    .version("1.0.0", "-v, --version")
    .usage(`[options] command`)
    .option("-V, --verbose", "Display verbose output")
    .description("Command line interface for the CSharp2TS extension");

export const isVerbose =
    process.argv.includes("-V") || process.argv.includes("--verbose");

program
    .command("convert")
    .description(
        `Convert a C# file or directory to Typescript
                    [-n, --name FILENAME]
                    [-d, --directory DIRECTORY]
                    [-c, --custom CUSTOM]
                    `
    )
    .option(
        "-n, --name [filename]",
        "Individual file"
    )
    .option(
        "-d, --directory [directory]",
        "The source directory"
    )
    .option(
        "-c, --custom ['/import ApiController/g,import BaseHttpController']",
        `Any custom rules to run at end of conversion.
        Must be in pairs separated by a comma.
        First of a pair is the regular expression string, and second is the replacement string.`
    )
    .action(({ name, directory, custom }) => {
        const fileName = typeof name !== "function" ? name : undefined;
        let customRules: string[] = [];
        const customRulesRaw: string | undefined = custom !== undefined && custom.length > 0 ? custom : undefined;
        if (customRulesRaw) {
            customRules = customRulesRaw.split(",");
            if (customRules.length % 2 !== 0) {
                // tslint:disable-next-line no-console
                console.error("Custom rules must be in pairs");
                program.outputHelp();
                process.exit(1);
            }
        }
        // tslint:disable-next-line no-console
        console.log("custom", customRules);
        if (fileName !== undefined && fileName.length > 0) {
            convertFile(fileName, customRules);
        } else if (directory !== undefined && directory.length > 0) {
            convertDirectory(directory, customRules);
        } else {
            program.outputHelp();
        }
    });

program.on("command:*", () => {
    // tslint:disable-next-line no-console
    console.error(`\nInvalid command: ${program.args.join(" ")}`);
    // tslint:disable-next-line no-console
    console.log("\nSee --help for a list of available commands.");
    process.exit(1);
});

if (
    process.env.NODE_ENV !== "test" &&
    (process.argv.length <= 2 || (isVerbose && process.argv.length === 3))
) {
    program.outputHelp();
} else {
    program.parse(process.argv);
}
