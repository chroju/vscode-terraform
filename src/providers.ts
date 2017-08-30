import * as vscode from 'vscode';

import { CompletionProvider } from './providers/completion';
import { DefinitionProvider } from './providers/definition';
import { DocumentSymbolProvider } from './providers/documentsymbol';
import { ReferenceProvider } from './providers/reference';
import { RenameProvider } from './providers/rename';
import { WorkspaceSymbolProvider } from './providers/workspacesymbol';

export function registerProviders(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.languages.registerDefinitionProvider("terraform", new DefinitionProvider));
  ctx.subscriptions.push(vscode.languages.registerReferenceProvider("terraform", new ReferenceProvider));
  ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider("terraform", new CompletionProvider, '.', '\"'));
  ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("terraform", new DocumentSymbolProvider));
  ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider));
  ctx.subscriptions.push(vscode.languages.registerRenameProvider("terraform", new RenameProvider));
}