import * as vscode from 'vscode';

import { index, SymbolType } from '../index';
import { toCompletionKind } from '../helpers';

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
