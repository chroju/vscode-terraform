import * as vscode from 'vscode';

import { Parser } from './parser';
import { process } from './process';
import { first } from './helpers';

import { getConfiguration } from './configuration';
import { errorDiagnosticCollection, outputChannel } from './extension';
import { registerProviders } from './providers';

export function createDiagnostic(error: Parser.ParseError) {
  let range = Parser.toRange(error.Location);
  return new vscode.Diagnostic(range, error.Message, vscode.DiagnosticSeverity.Error);
}

class Reference {
  source: vscode.Location;
  target: vscode.Location;
}

export enum SymbolType {
  Variable,
  Resource,
  Data,
  Module,
  Output,
  Provider,
  Unknown
}

export class Symbol extends vscode.SymbolInformation {
  type: SymbolType;

  constructor(uri: vscode.Uri, type: SymbolType, section: Parser.TypedSection | Parser.UntypedSection) {
    super(section.Name, Symbol.toKind(type), Parser.toRange(section.Location), uri);
    this.type = type;
  }

  matchingType(types?: SymbolType[]) : boolean {
    if (!types) return true;

    return types.indexOf(this.type) != -1;
  }

  public static toKind(type: SymbolType): vscode.SymbolKind {
    switch(type) {
      case SymbolType.Variable: return vscode.SymbolKind.Variable;
      case SymbolType.Resource: return vscode.SymbolKind.Object;
      case SymbolType.Data: return vscode.SymbolKind.Constant;
      case SymbolType.Module: return vscode.SymbolKind.Module;
      case SymbolType.Output: return vscode.SymbolKind.Property;
      case SymbolType.Provider: return vscode.SymbolKind.Namespace;
    }

    return vscode.SymbolKind.Null;
  }

  public static toType(type: string): SymbolType {
    switch(type.toLowerCase()) {
      case "variable": return SymbolType.Variable;
      case "resource": return SymbolType.Resource;
      case "data":     return SymbolType.Data;
      case "module":   return SymbolType.Module;
      case "output":   return SymbolType.Output;
      case "provider": return SymbolType.Provider;
    }

    return SymbolType.Unknown;
  }
}

class Index {
  private _byUri = new Map<string, Parser.IndexResult>();
  private _symbolsByUri = new Map<string, Symbol[]>();
  private _symbols = new Map<string, Symbol[]>();
  private _references = new Map<string, Reference[]>();
  private _referencesById = new Map<string, vscode.Location[]>();

  updateUri(uri: vscode.Uri) {
    vscode.workspace.openTextDocument(uri).then((doc) => {
      this.updateDocument(doc);
    });
  }

  updateDocument(doc: vscode.TextDocument) {
    if (doc.languageId != "terraform" || doc.isDirty) {
      outputChannel.appendLine(`indexer: Ignoring document: ${doc.uri} (languageId: ${doc.languageId}, isDirty: ${doc.isDirty}`);
      return;
    }

    process(doc.getText())
      .then((result) => {
        if (result != null) {
          this.update(doc.uri, result)
        }
      })
      .catch((error) => outputChannel.appendLine(`indexer: Could not parse: ${doc.uri}: ${error}`));
  }

  findDefinition(doc: vscode.TextDocument, pos: vscode.Position): (vscode.Location | null) {
    let references = this._references.get(doc.uri.toString());
    if (references === undefined) {
      return null;
    }

    let reference = references.find((r) => r.source.range.contains(pos));
    if (reference === undefined) {
      return null;
    }

    return reference.target;
  }

  findReferences(targetId: string): vscode.Location[] {
    let references = this._referencesById.get(targetId);
    if (references === undefined) {
      return [];
    }
    return references;
  }

  deleteUri(uri: vscode.Uri) {
    this._byUri.delete(uri.toString());

    this.rebuildSymbols();
    this.rebuildReferences();
    errorDiagnosticCollection.delete(uri);
  }

  getDocumentSymbols(uri: vscode.Uri, match?: string): Symbol[] {
    let result = this._symbolsByUri.get(uri.toString());
    if (result === undefined) {
      return [];
    }
    return result;
  }

  * getSymbols(match: string, type?: SymbolType[]): IterableIterator<Symbol> {
    for (let symbols of this._symbols.values()) {
      for (let symbol of symbols) {
        if (symbol.name.match(match) && symbol.matchingType(type))
          yield symbol;
      }
    }
  }

  private update(uri: vscode.Uri, result: Parser.IndexResult) {
    console.log("Updating index for ", uri.toString());
    this._byUri.set(uri.toString(), result);

    this.rebuildSymbols();
  }

  private rebuildSymbols() {
    this._symbols.clear();

    for (let [uriString, index] of this._byUri) {
      let uri = vscode.Uri.parse(uriString);

      let symbols = [];
      symbols.push( ...index.Variables.map((v) => new Symbol(uri, SymbolType.Variable, v)) );
      symbols.push( ...index.DefaultProviders.map((d) => new Symbol(uri, SymbolType.Provider, d)) );
      symbols.push( ...index.Providers.map((p) => new Symbol(uri, SymbolType.Provider, p)) );
      symbols.push( ...index.Resources.map((r) => new Symbol(uri, SymbolType.Resource, r)) );
      symbols.push( ...index.DataResources.map((d) => new Symbol(uri, SymbolType.Data, d)) );
      symbols.push( ...index.Modules.map((m) => new Symbol(uri, SymbolType.Module, m)) );
      symbols.push( ...index.Outputs.map((o) => new Symbol(uri, SymbolType.Output, o)) );

      this.addSymbols(symbols);

      this._symbolsByUri.set(uriString, symbols);
    }
  }

  private addSymbols(symbols: Symbol[]) {
    for (let symbol of symbols) {
      if (this._symbols.has(symbol.name)) {
        this._symbols.get(symbol.name).push(symbol);
      } else {
        this._symbols.set(symbol.name, new Array<Symbol>(symbol));
      }
    }
  }

  private rebuildReferences() {
    this._references.clear();
    this._referencesById.clear();

    for (let [uriString, index] of this._byUri) {
      let uri = vscode.Uri.parse(uriString);
      let allReferences = [];
      for (let targetId in index.References) {
        if (!this.validTarget(targetId)) {
          continue;
        }

        let reference = index.References[targetId];
        let target = this.findTargetLocation(reference.Name, Symbol.toType(reference.Type));
        if (target === undefined) {
          reference.Locations.forEach((l) => {
            index.Errors.push({
              Message: "Cannot find reference",
              Location: l
            });
          });
          continue;
        }
        let references = reference.Locations.map((r): Reference => {
          return {
            source: { uri: uri, range: Parser.toRange(r) },
            target: target
          };
        });

        allReferences.push(...references);

        let locations = reference.Locations.map((l) => Parser.toLocation(l, { uri: uri }));
        if (!this._referencesById.has(targetId)) {
          this._referencesById.set(targetId, locations);
        } else {
          this._referencesById.get(targetId).push(...locations);
        }
      }

      if (allReferences.length > 0) {
        this._references.set(uriString, allReferences);
      }
    }
  }

  private validTarget(id: string): boolean {
    return this._symbols.has(id);
  }

  private findTargetLocation(id: string, type?: SymbolType): vscode.Location {
    if (!this._symbols.has(id)) {
      return null;
    }

    let symbols = this._symbols.get(id);
    if (symbols.length == 0) {
      return null;
    }

    let matching = symbols.filter((s) => s.type == type);
    if (matching.length == 0) {
      return null;
    }
    return matching[0].location;
  }

  private updateDiagnostics(uri: vscode.Uri, result: Parser.IndexResult) {
    let diagnostics = result.Errors.map(createDiagnostic);
    errorDiagnosticCollection.set(uri, diagnostics);
  }
}

export let index = new Index();

export function createWorkspaceWatcher(): vscode.FileSystemWatcher {
  var watcher = vscode.workspace.createFileSystemWatcher("**/*.{tf,tfvars}");
  watcher.onDidChange((uri) => { index.updateUri(uri) });
  watcher.onDidCreate((uri) => { index.updateUri(uri) });
  watcher.onDidDelete((uri) => { index.deleteUri(uri) });
  return watcher;
}

let initialized = false;

export function initializeIndex(ctx: vscode.ExtensionContext) {
  if (!getConfiguration().indexing.enabled) {
    // listen for enable signal:
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
      if (getConfiguration().indexing.enabled && !initialized) {
        initialized = true;
        initializeIndex(ctx);
      }
    }));

    return;
  }

  ctx.subscriptions.push(createWorkspaceWatcher());

  console.log("Scanning for all terraform files...");
  vscode.workspace.findFiles("**/*.{tf,tfvars}", "")
    .then((uris) => {
      console.log("Scanning done.");
      uris.forEach((uri) => index.updateUri(uri));
    }, (error) => {
      console.log("Scanning failed.");
    });

  // register providers which depend on index
  registerProviders(ctx);
}
