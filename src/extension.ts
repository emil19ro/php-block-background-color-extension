import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "space-background" is now active!');

    // Variabila pentru a ține instanța decorării
    let decorationType: vscode.TextEditorDecorationType | undefined;
    let previousLineCount: number | undefined;

    // Funcția pentru aplicarea decorării
    const updateBackground = (editor: vscode.TextEditor) => {
        const doc = editor.document;
        const fullText = doc.getText();
        const lines = fullText.split('\n');

        // Verificăm dacă dimensiunea documentului s-a schimbat
        if (previousLineCount === undefined || previousLineCount !== lines.length) {
            // Dacă dimensiunea s-a schimbat, continuăm să actualizăm
            previousLineCount = lines.length;

            // Obținem culoarea din setările VS Code
            const config = vscode.workspace.getConfiguration("spaceBackground");
            const backgroundColor = config.get<string>("backgroundColor", "rgba(48, 48, 48, 0.2)");

            // Crearea unei noi instanțe a decorării
            if (decorationType) {
                // Dacă există o instanță veche, o distrugem pentru a preveni suprascrierea necontrolată
                decorationType.dispose();
            }

            decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: backgroundColor,
                isWholeLine: true,
            });

            const decorations: vscode.DecorationOptions[] = [];
            let inPhpBlock = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Detectăm începutul blocului PHP
                if (!inPhpBlock && line.includes('<?php')) {
                    inPhpBlock = true;
                }

                // Dacă suntem într-un bloc PHP, marcăm fiecare linie
                if (inPhpBlock) {
                    const startPos = new vscode.Position(i, 0);
                    const endPos = new vscode.Position(i, lines[i].length);
                    const range = new vscode.Range(startPos, endPos);
                    decorations.push({ range });
                }

                // Detectăm sfârșitul blocului PHP
                if (inPhpBlock && line.includes('?>')) {
                    inPhpBlock = false;  // Ieșim din blocul PHP
                }
            }

            // Aplicăm decorarea pe liniile selectate
            editor.setDecorations(decorationType, decorations);
        }
    };

    // Se activează automat pentru fișiere PHP
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'php') {
            updateBackground(editor);
        }
    });

    // Recalculăm background-ul doar când dimensiunea documentului s-a schimbat
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'php' && event.document === editor.document) {
            const lines = editor.document.getText().split('\n');
            if (lines.length !== previousLineCount) {
                // Dacă numărul de linii s-a schimbat, actualizăm background-ul
                updateBackground(editor);
            }
        }
    });

    // Dacă este deja deschis un editor PHP, aplică decorarea
    if (vscode.window.activeTextEditor?.document.languageId === 'php') {
        updateBackground(vscode.window.activeTextEditor);
    }
}

export function deactivate() {}
