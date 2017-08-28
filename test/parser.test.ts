import * as assert from 'assert';
import * as vscode from 'vscode';

import { Parser } from '../src/parser';

suite("Parser Tests", () => {
  test("parse correctly handles old index", () => {
    assert.doesNotThrow(() => Parser.parseIndex("{}"));
    assert.doesNotThrow(() => Parser.parseIndex('{ "Version": "0.0.0" }'));
  });

  test("parse fails on unsupported index version", () => {
    assert.throws(() => Parser.parseIndex('{ "Version": "9.9.9" }'));
  });

  test("parse adds missing .Type in references", () => {
    let json = JSON.stringify({
      References: {
        "unknown": {
          Name: "unknown",
          Locations: [{
            Filename: "",
            Line: 1,
            Column: 1,
            Offset: 0
          }]
        }
      }
    });

    let index = Parser.parseIndex(json);

    assert.deepEqual(index.References, {
      unknown: {
        Name: "unknown",
        Type: "variable",
        Locations: [{
          Filename: "",
          Line: 1,
          Column: 1,
          Offset: 0
        }]
      }
    });
  });

  test("toRange sets end column to MAX_VALUE if length is missing", () => {
    let location = { Filename: "", Line: 1, Column: 1, Offset: 0 };

    let range = Parser.toRange(location);

    assert.equal(range.start.line, 0);
    assert.equal(range.start.character, 0);
    assert.equal(range.end.line, 0);
    assert.equal(range.end.character, Number.MAX_VALUE);
  });

  test("toRange correctly sets end column if length is supplied", () => {
    let location = { Filename: "", Line: 1, Column: 1, Offset: 0 };

    let range = Parser.toRange(location, 10);

    assert.equal(range.start.line, 0);
    assert.equal(range.start.character, 0);
    assert.equal(range.end.line, 0);
    assert.equal(range.end.character, 10);
  });

  test("toLocation overrides uri if provided", () => {
    let original = { Filename: "/smurf", Column: 1, Line: 1, Offset: 0 };
    
    let location = Parser.toLocation(original, { uri: vscode.Uri.file("/gurgel") });
    assert.equal(location.uri.toString(), "file:///gurgel");
  });

  test("toLocation forwards length if provided", () => {
    let original = { Filename: "/smurf", Column: 1, Line: 1, Offset: 0 };
    
    let location = Parser.toLocation(original, { length: 10 });
    assert.equal(location.range.end.character - location.range.start.character, 10);
  });  
});