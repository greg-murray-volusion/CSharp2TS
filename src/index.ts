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
                    [-n, --name FILENAME] [-d, --directory DIRECTORY]`
    )
    .option(
        "-n, --name [filename]",
        "Individual file"
    )
    .option(
        "-d, --directory [directory]",
        "The source directory"
    )
    .action(({ name, directory }) => {
        const fileName = typeof name !== "function" ? name : undefined;
        if (fileName !== undefined && fileName.length > 0) {
            convertFile(fileName);
        } else if (directory !== undefined && directory.length > 0) {
            convertDirectory(directory);
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
