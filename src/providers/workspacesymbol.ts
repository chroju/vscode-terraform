import * as vscode from 'vscode';
import { index } from '../index';

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    return [...index.getSymbols(query)];
  }
}
