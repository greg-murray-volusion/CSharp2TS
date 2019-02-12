'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ExtensionConfig } from "./config";
import { cs2ts } from "./converter";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "csharp2ts" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.cs2ts', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return;

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(e => {
            var config = getConfiguration();
            e.replace(selection, cs2ts(text, config));
        });
    });
    context.subscriptions.push(disposable);
}

function getConfiguration(): ExtensionConfig {

    const rawTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("trimPostfixes") as string | string[];
    const trimPostfixes: string[] = typeof rawTrimPostfixes == "string" ? [rawTrimPostfixes] : rawTrimPostfixes;

    const propertiesToCamelCase = vscode.workspace.getConfiguration('csharp2ts').get("propertiesToCamelCase") as boolean;
    const recursiveTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("recursiveTrimPostfixes") as boolean;
    const ignoreInitializer = vscode.workspace.getConfiguration('csharp2ts').get("ignoreInitializer") as boolean;
    const removeMethodBodies = vscode.workspace.getConfiguration('csharp2ts').get("removeMethodBodies") as boolean;
    const removeConstructors = vscode.workspace.getConfiguration('csharp2ts').get("removeConstructors") as boolean;
    const methodStyle = vscode.workspace.getConfiguration('csharp2ts').get("methodStyle") as ("signature" | "lambda");
    const byteArrayToString = vscode.workspace.getConfiguration('csharp2ts').get("byteArrayToString") as boolean;
    const dateToDateOrString = vscode.workspace.getConfiguration('csharp2ts').get("dateToDateOrString") as boolean;
    const removeWithModifier = vscode.workspace.getConfiguration('csharp2ts').get("removeWithModifier") as string[];
    const removeNameRegex = vscode.workspace.getConfiguration('csharp2ts').get("removeNameRegex") as string;
    const classToInterface = vscode.workspace.getConfiguration('csharp2ts').get("classToInterface") as boolean;
    const preserveModifiers = vscode.workspace.getConfiguration('csharp2ts').get("preserveModifiers") as boolean;

    return {
        propertiesToCamelCase,
        trimPostfixes,
        recursiveTrimPostfixes,
        ignoreInitializer,
        removeMethodBodies,
        removeConstructors,
        methodStyle,
        byteArrayToString,
        dateToDateOrString,
        removeWithModifier,
        removeNameRegex,
        classToInterface,
        preserveModifiers
    };
}


// this method is called when your extension is deactivated
export function deactivate() {
}
