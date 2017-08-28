import * as vscode from 'vscode';

export namespace Parser {

  export interface Location {
    Filename: string;
    Offset: number;
    Line: number; // starts at 1
    Column: number; // starts at 1
  }

  export interface ParseError {
    Message: string;
    Location: Location;
  }

  export interface Variable {
    Name: string;
    Location: Location;
  }

  export interface Resource {
    Name: string;
    Type: string;
    Location: Location;
  }

  export interface Output {
    Name: string;
    Location: Location;
  }

  export interface Reference {
    Name: string;
    Type: string;
    Locations: Location[];
  }

  export interface IndexResult {
    Errors: ParseError[];
    Variables: Variable[];
    Resources: Resource[];
    Outputs: Output[];
    References: { [targetId: string]: Reference };
  }

  export function parseIndex(json: string): IndexResult {
    return <IndexResult>JSON.parse(json);
  }

  export function toRange(location: Location, length?: number): vscode.Range {
    const endColumn = length === undefined ? Number.MAX_VALUE : (location.Column - 1 + length);
    return new vscode.Range(location.Line - 1, location.Column - 1,
      location.Line - 1, endColumn);
  }

  export function toLocation(location: Location, options: { uri?: vscode.Uri, length?: number } = {}): vscode.Location {
    if (options.uri === undefined) {
      options.uri = vscode.Uri.file(location.Filename);
    }

    return {
      uri: options.uri,
      range: toRange(location, options.length)
    }
  }

}