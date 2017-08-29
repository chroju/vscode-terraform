import * as assert from 'assert';
import * as vscode from 'vscode';

import { first } from '../src/helpers';

suite("Helper Tests", () => {
  test("returns null if sequence is empty", () => {
    assert.equal(first([]), null);
  });

  test("returns first item", () => {
    assert.equal(first([1]), 1);
  });
});