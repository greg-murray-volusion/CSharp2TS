'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as types from './types';

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, parseConstructor } from "./methods";

import { generateProperty, trimMemberName, generateMethod, generateConstructor, generateClass } from "./generators";
import { ExtensionConfig } from "./config";
import { ParseResult } from "./parse";
import compose = require("./compose");
import regexs = require("./regexs");
import { parseXmlDocBlock, generateJsDoc } from "./commentDoc";
import { parseClass } from "./classes";

function csFunction<T>(parse: (code: string) => ParseResult<T> | null, generate: (value: T, config: ExtensionConfig) => string) {
    return function (code: string, config: ExtensionConfig) {
        const parseResult = parse(code);
        if (!parseResult) {
            return null;
        } else {
            return {
                result: generate(parseResult.data, config),
                index: parseResult.index,
                length: parseResult.length
            } as MatchResult;
        }
    }
}

/**Convert a c# automatic or fat arrow property to a typescript property. Returns null if the string didn't match */
const csAutoProperty = csFunction(parseProperty, generateProperty);
/**Convert a C# method to a typescript method signature */
const csMethod = csFunction(parseMethod, generateMethod);
const csConstructor = csFunction(parseConstructor, generateConstructor);
const csCommentSummary = csFunction(parseXmlDocBlock, generateJsDoc);
const csClass = csFunction(parseClass, generateClass);

function csAttribute(code: string, config: ExtensionConfig): MatchResult {
    var patt = /[ \t]*\[\S*\][ \t]*\r?\n/;
    var arr = patt.exec(code);
    if (arr == null) return null;

    return {
        result: "",
        index: arr.index,
        length: arr[0].length
    };
}

interface Match {
    /**Replacement string */
    result: string;
    /**Original index */
    index: number;
    /**Original lenght */
    length: number;
}

type MatchResult = Match | null;

function csPublicMember(code: string, config: ExtensionConfig): MatchResult {
    var patt = /public\s*(?:(?:abstract)|(?:sealed))?(\S*)\s+(.*)\s*{/;
    var arr = patt.exec(code);

    var tsMembers: { [index: string]: string } = {
        'class': 'interface',
        'struct': 'interface'
    };

    if (arr == null) return null;
    var tsMember = tsMembers[arr[1]];
    var name = trimMemberName(arr[2], config);
    const result = name.includes("(")
        ? `${name}: ${tsMember || arr[1]} {`
        : `export ${tsMember || arr[1]} ${name} {`;
    return {
        result,
        index: arr.index,
        length: arr[0].length
    };
}

/**Find the next match */
function findMatch(code: string, startIndex: number, config: ExtensionConfig): MatchResult {
    code = code.substr(startIndex);

    var functions: ((code: string, config: ExtensionConfig) => MatchResult)[] = [
        csClass,
        csAutoProperty,
        csConstructor,
        csMethod,
        csCommentSummary,
        csAttribute,
        csPublicMember
    ];

    var firstMatch: MatchResult = null;
    for (let i = 0; i < functions.length; i++) {
        var match = functions[i](code, config);
        if (match != null && (firstMatch == null || match.index < firstMatch.index)) {
            firstMatch = match;
        }
    }

    return firstMatch ? {
        result: firstMatch.result,
        index: firstMatch.index + startIndex,
        length: firstMatch.length
    } : null;
}

/**Convert c# code to typescript code */
export function cs2ts(code: string, config: ExtensionConfig): string {
    var ret = "";

    var index = 0;
    while (true) {
        var nextMatch = findMatch(code, index, config);
        if (nextMatch == null)
            break;
        //add the last unmatched code:
        ret += code.substr(index, nextMatch.index - index);

        //add the matched code:
        ret += nextMatch.result;

        //increment the search index:
        index = nextMatch.index + nextMatch.length;
    }
    //add the last unmatched code:
    ret += code.substr(index);

    return ret;
}

