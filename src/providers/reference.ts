import * as vscode from 'vscode';
import { index } from '../index';

export class ReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let range = document.getWordRangeAtPosition(position);
    return index.findReferences(document.getText(range));
  }
}