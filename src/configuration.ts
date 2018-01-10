import * as vscode from 'vscode';
import { outputChannel } from './extension'

interface TerraformIndexConfiguration {
  enabled: boolean;
  indexerPath: string;
  liveIndexing: boolean;
  liveIndexingDelay: number;
}

interface TerraformFormatConfiguration {
  enable: boolean;
  ignoreExtensions: Array<string>;
  ignoreExtensionsOnSave: Array<string>;
}

interface TerraformConfiguration {
  formatOnSave: boolean;
  formatVarsOnSave?: boolean;
  path: string;
  templateDirectory: string;
  lintPath: string;
  lintConfig?: string;
  indexing: TerraformIndexConfiguration;
  format: TerraformFormatConfiguration;
}

export function getConfiguration(): TerraformConfiguration {
  let raw = vscode.workspace.getConfiguration("terraform");

  // needed for conversion
  let convertible = {
    formatOnSave: raw.formatOnSave,
    formatVarsOnSave: raw.formatVarsOnSave,
    path: raw.path,
    templateDirectory: raw.templateDirectory,
    lintPath: raw.lintPath,
    lintConfig: raw.lintConfig,
    indexing: raw.indexing,
    format: raw.format
  };

  let config = <TerraformConfiguration>convertible;

  // handle deprecated settings
  if (config.formatVarsOnSave !== true && config.format.ignoreExtensionsOnSave.indexOf(".tfvars") === -1) {
    outputChannel.appendLine(`terraform.config: Found deprecated setting 'terraform.formatVarsOnSave', please consider using 'terraform.format.ignoreExtensionsOnSave' instead`);
    config.format.ignoreExtensionsOnSave.push(".tfvars");
  }

  return config;
}