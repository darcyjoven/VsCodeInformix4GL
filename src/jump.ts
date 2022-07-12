import * as vscode from "vscode";


function searchMatchPostion(regMtach: RegExp, regMtachWithStart: RegExp, document: vscode.TextDocument, word: string): vscode.Position | undefined {
    if (regMtach.test(document.getText())) {
        //本文件有对应的函数
        for (let i = 0; i < document.lineCount; i++) {
            //获取到指定行内容
            if (regMtachWithStart.test(document.lineAt(i).text)) {
                //此行匹配到了
                if (document.lineAt(i).text.indexOf(word) >= 0) {
                    return new vscode.Position(i, document.lineAt(i).text.indexOf(word))
                }
            }
        }
    }
}

function searchVariablePostion(document: vscode.TextDocument,word: string,index: number): vscode.Position|undefined{
    let matchReg = new RegExp(`[^#]* *define *${word} +`,"i")
    if (matchReg.test(document.getText())){
        // 找的到
        for (let i=index;i>=0;i--){
            if (matchReg.test(document.lineAt(i).text)){
                return new vscode.Position(i,document.lineAt(i).text.indexOf(word))
            }
        }
    } 
    return
}

/**
 * 跳转本文件局部变量位置
 * @param document 
 * @param position 所在位置
 * @param token 
 */
function provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Definition | vscode.DefinitionLink[] | undefined {
    const fileName = document.fileName  //当前文件名
    const word = document.getText(document.getWordRangeAtPosition(position))    //当前光标所在单词
    const line = document.lineAt(position)       //当前所在行

    //const funMtachReg = new RegExp(`^\\(\\?!function\\).*${word} *\\(`, 'i')     //当前单词是函数名的正则匹配表达式
    let funMtachReg = new RegExp(`^(?!function).*${word} *\\(`, "i")
    let declMtachReg = new RegExp(`^ *(foreach|fetch) *${word}`, 'i')     // foreach 和 fetch 找declare
    let prepMtachReg = new RegExp(`^ *execute *${word}`, 'i')     // execute 找prepare
    let defMtachReg = new RegExp('ab+c', 'i')       //寻找define
    let funMtachRegPos = new RegExp(` *function *${word} *\\(`, 'i')
    let funMtachRegPos1 = new RegExp(`^ *(public|private)? *function *${word} *\\(`, 'i')
    let delcMtachRegPos = new RegExp(` *declare *${word} *`, 'i')
    let delcMtachRegPos1 = new RegExp(`^ *declare *${word} *`, 'i')
    let prepMtachRegPos = new RegExp(` *prepare *${word} *`, 'i')
    let prepMtachRegPos1 = new RegExp(`^ *prepare *${word} *`, 'i')


    // 函数跳转
    if (line.text.match(funMtachReg)) {
        //是函数 
        let position = searchMatchPostion(funMtachRegPos,funMtachRegPos1,document,word)
        if (position===undefined){ 
        }else{
            return new vscode.Location(vscode.Uri.file(fileName), position) 
        }
        
    }

    // declare跳转
    if (line.text.match(declMtachReg)) {
        //是foreach 或者 fetch
        let position = searchMatchPostion(delcMtachRegPos,delcMtachRegPos1,document,word)
        if (position===undefined){
            
        }else{
            return new vscode.Location(vscode.Uri.file(fileName), position) 
        }
    }

    // prepare跳转
    if (line.text.match(prepMtachReg)) {
        //是函数
        let position = searchMatchPostion(prepMtachRegPos,prepMtachRegPos1,document,word)
        if (position===undefined){
            
        }else{
            return new vscode.Location(vscode.Uri.file(fileName), position) 
        }
    }

    // 变量跳转
    // ADD: darcy:2022/04/14 s---
    let positionVariable = searchVariablePostion(document,word,position.line)
    if (positionVariable===undefined){
            
    }else{
        return new vscode.Location(vscode.Uri.file(fileName), positionVariable) 
    }
    // ADD: darcy:2022/04/14 e---


    return undefined
}


//导出
export function Jump(content: vscode.ExtensionContext) {
    content.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            {
                scheme: "file",
                language: "4GL",
            },
            { provideDefinition }
        )
    )
};
