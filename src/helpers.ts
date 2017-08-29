import * as vscode from 'vscode';

export function isTerraformDocument(document : vscode.TextDocument) : boolean {
  if (document.languageId !== "terraform") {
    return false;
  }

  return (document.fileName.endsWith('.tf') || document.fileName.endsWith('.tfvars'));
}

export function first(sequence: any[], result: any = null) : any {
  if (sequence.length > 0) {
    return sequence[0];
  }

  return result;
}

export function toCompletionKind(kind: vscode.SymbolKind): vscode.CompletionItemKind {
  switch (kind) {
    case vscode.SymbolKind.File:        return vscode.CompletionItemKind.File;
    case vscode.SymbolKind.Module:      return vscode.CompletionItemKind.Module;
    case vscode.SymbolKind.Namespace:   return vscode.CompletionItemKind.Module;
    case vscode.SymbolKind.Package:     return vscode.CompletionItemKind.Module;
    case vscode.SymbolKind.Class:       return vscode.CompletionItemKind.Class;
    case vscode.SymbolKind.Method:      return vscode.CompletionItemKind.Method;
    case vscode.SymbolKind.Property:    return vscode.CompletionItemKind.Property;
    case vscode.SymbolKind.Field:       return vscode.CompletionItemKind.Field;
    case vscode.SymbolKind.Constructor: return vscode.CompletionItemKind.Constructor;
    case vscode.SymbolKind.Enum:        return vscode.CompletionItemKind.Enum;
    case vscode.SymbolKind.Interface:   return vscode.CompletionItemKind.Interface;
    case vscode.SymbolKind.Function:    return vscode.CompletionItemKind.Function;
    case vscode.SymbolKind.Variable:    return vscode.CompletionItemKind.Variable;
  }

  return vscode.CompletionItemKind.Value;
}