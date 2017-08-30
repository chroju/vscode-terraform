import * as vscode from 'vscode';
import { index } from '../index';

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return index.getDocumentSymbols(document.uri);
  }
}