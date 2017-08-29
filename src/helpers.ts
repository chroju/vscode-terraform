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