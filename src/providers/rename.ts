import * as vscode from 'vscode';
import { index } from '../index';

export class RenameProvider implements vscode.RenameProvider {
  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let range = document.getWordRangeAtPosition(position);
    if (range === undefined) {
      return null;
    }

    let symbol = document.getText(range);
    let references = index.findReferences(document.getText(range));
    if (references.length == 0) {
      return null;
    }

    const magic = 4; // length("var.")
    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, range, newName);
    references.forEach((location) => {
      let range = new vscode.Range(
        new vscode.Position(location.range.start.line, location.range.start.character + magic),
        new vscode.Position(location.range.start.line, location.range.start.character + magic + symbol.length));

      edit.replace(location.uri, range, newName);
    });
    return edit;
  }
}