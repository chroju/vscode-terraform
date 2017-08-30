import * as vscode from 'vscode';
import { index } from '../index';

export class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    return index.findDefinition(document, position);
  }
}