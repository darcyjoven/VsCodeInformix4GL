import * as vscode from "vscode";
import { SwmfConfigDocumentSymbolProvider } from "./SwmfConfigDocumentSymbolProvider";
import * as jump from "./jump"

export function activate(context: vscode.ExtensionContext) {
  //outline 功能
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      {
        scheme: "file",
        language: "4GL",
      },
      new SwmfConfigDocumentSymbolProvider()
    )
  ); 
  //语义跳转功能
  jump.Jump(context)
  
  //
  
}



