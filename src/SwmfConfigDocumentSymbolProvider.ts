import * as vscode from "vscode";

export class SwmfConfigDocumentSymbolProvider
  implements vscode.DocumentSymbolProvider {
  docNowLine: number = 0
  private formatFunc(cmd: string): string {
    return cmd
      .replace(/^ *(public|private)?/i, "")
      .replace(/^ *function /i, "")
      .replace(/\(.*/, "")
      .trim();
  }

  private formatRep(cmd: string): string {
    return cmd
      .replace(/^ *report /i, "")
      .replace(/\(.*/, "")
      .trim();
  }
  private formatGlo(cmd: string): string {
    return cmd
      .replace(/^ *GLOBALS /i, "")
      .replace(/\(.*/, "")
      .trim();
  }
  private formatFor1(cmd: string): string {
    //先匹配foreach
    cmd = cmd
      .replace(/^ *foreach */i, "")
      .replace(/ *into.*/i, "")
      .trim();
    //在匹配for
    cmd = cmd
      .replace(/^ *for */i, "")
      .trim();
    return cmd;
  }
  private formatFor2(cmd: string): string {
    //先匹配foreach
    let str = cmd.match(/^ *foreach/i);
    if (str) {
      return str[0];
    } else {
      //先匹配for
      str = cmd.match(/^ *for/i);
      if (str) {
        return str[0];
      } else {
        return "for|foreach";
      }
    }
  }
  /**
   * 递归实现for循环抓取
   * @param father 父节点
   * @param start 开始行数
   * @param end 结束行数
   * @param document 文件
   * @param endflag 结束标识
   */
  private docuChilren(father: vscode.DocumentSymbol, start: number, end: number, document: vscode.TextDocument, endflag: RegExp): number {

    let line = document.lineAt(start);
    start > this.docNowLine ? this.docNowLine = start : start;
    if (start >= end) {
      //文件结束
      return start;
    } else if (line.text.match(endflag)) {
      //end
      return start;
    } else {
      if (line.text.match(/^ *(for) /i)) {
        // 匹配到for
        let marker_symbol = new vscode.DocumentSymbol(
          this.formatFor1(line.text),
          this.formatFor2(line.text),
          vscode.SymbolKind.Event,
          line.range,
          line.range);
        this.docuChilren(marker_symbol, start + 1, end, document, /^ *end *for */i);
        father.children.push(marker_symbol);
      } else {
        if (line.text.match(/^ *(foreach) /i)){
          // 匹配到foreach
          let marker_symbol = new vscode.DocumentSymbol(
            this.formatFor1(line.text),
            this.formatFor2(line.text),
            vscode.SymbolKind.Event,
            line.range,
            line.range);
          this.docuChilren(marker_symbol, start + 1, end, document, /^ *end *foreach */i);
          father.children.push(marker_symbol);
        } 
        this.docuChilren(father, start + 1, end, document, endflag);
      }
    }
    return start;
  }



  public provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.DocumentSymbol[]> {
    return new Promise((resolve) => {
      let symbols: vscode.DocumentSymbol[] = [];
      let nodes = [symbols];

      let key = vscode.SymbolKind.Key;
      let func = vscode.SymbolKind.Function;
      this.docNowLine=0
      for (var i = 0; i < document.lineCount && i < 40000; i++) {
        var line = document.lineAt(i);

        if (line.text.match(/^ *(public|private)? *function /i)) {
          let marker_symbol = new vscode.DocumentSymbol(
            this.formatFunc(line.text),
            (i+1).toString(), //MOD:darcy:2022/04/14 函数后显示行数
            func,
            line.range,
            line.range
          );

          /* 判断foreach */
          var matchStack = [];
          matchStack.push("function"); //最后function没有后就是结束

          this.docuChilren(marker_symbol, i + 1, document.lineCount, document, /^ *end *function */i);
          this.docNowLine > i ? i = this.docNowLine : i;
          nodes[nodes.length - 1].push(marker_symbol);

        } else if (line.text.match(/^ *report /i)) {
          let marker_symbol = new vscode.DocumentSymbol(
            this.formatRep(line.text),
            "report",
            func,
            line.range,
            line.range
          );

          nodes[nodes.length - 1].push(marker_symbol);
        } else if (line.text.startsWith("MAIN")) {
          let marker_symbol = new vscode.DocumentSymbol(
            "MAIN",
            "MAIN statement",
            func,
            line.range,
            line.range
          );

          nodes[nodes.length - 1].push(marker_symbol);
        } else if (line.text.startsWith("GLOBALS")) {
          let marker_symbol = new vscode.DocumentSymbol(
            "GLOBALS",
            this.formatGlo(line.text),
            key,
            line.range,
            line.range
          );

          nodes[nodes.length - 1].push(marker_symbol);
        }
      }

      resolve(symbols);
    });
  }
}
