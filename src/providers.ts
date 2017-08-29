import * as vscode from 'vscode';

import { index, SymbolType } from './index';
import { toCompletionKind } from './helpers';

export class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    return index.findDefinition(document, position);
  }
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let range = document.getWordRangeAtPosition(position);
    return index.findReferences(document.getText(range));
  }
}

export class CompletionProvider implements vscode.CompletionItemProvider {
  private getVariables(position: vscode.Position, includePrefix: boolean, match?: string): vscode.CompletionItem[] {
    return [...index.getSymbols(match, [SymbolType.Variable])].map((s) => {
      let item = new vscode.CompletionItem(s.name);
      item.kind = toCompletionKind(s.kind);
      if (includePrefix) {
        let range = new vscode.Range(position, position);
        item.textEdit = new vscode.TextEdit(range, `var.${s.name}`);
      }
      return item;
    });
  }

  private getOutputs(match?: string): vscode.CompletionItem[] {
    return [...index.getSymbols(match, [SymbolType.Output])].map((o) => {
      let item = new vscode.CompletionItem(o.name);
      item.kind = toCompletionKind(o.kind);
      return item;
    });
  }

  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    let range = new vscode.Range(new vscode.Position(position.line, 0), position);
    let before = document.getText(range);

    if (before.endsWith("var.")) {
      return this.getVariables(position, false);
    } else if (before.endsWith("${")) {
      let variables = this.getVariables(position, true);
      let outputs = this.getOutputs();

      return variables.concat(outputs);
    }
    return [];
  }
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return index.getDocumentSymbols(document.uri);
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    return [...index.getSymbols(query)];
  }
}

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