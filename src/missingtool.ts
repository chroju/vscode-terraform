import * as vscode from 'vscode';
import * as os from 'os';

export async function promptForMissingTool(tool: string): Promise<boolean> {
  await vscode.window.showInformationMessage(`Missing tool: ${tool}`);
  return false;
}
