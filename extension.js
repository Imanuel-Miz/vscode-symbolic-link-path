// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const isWin = process.platform === "win32";
const vscode = require('vscode');
var child_process = require('child_process');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	function getSystemDirCmd() {
		if (isWin) {
			return 'dir'
		}
		else {
			return 'ls -l'
		}
	}

	function systemSync(cmd) {
		return child_process.execSync(cmd).toString();
	  }

	function getSymlinikFilePath(originFilePath, checkPathCmd) {
		if (isWin) {
			const pattern = /\[([^]]+)\]/;
			const match = checkPathCmd.match(pattern);
			return match[1];
		}
		else {
			let shellExec = systemSync(`realpath ${originFilePath}`);
			return shellExec.replace(/[\r\n]/gm, '');
		}
	}

	let disposable = vscode.commands.registerCommand('goToSymbolicLink', fs => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		let originFilePath = fs.path;
		let checkPathCmd = systemSync(`${getSystemDirCmd()} ${originFilePath}`);
		if (checkPathCmd.includes(' -> ') || checkPathCmd.includes('SYMLINK')) {
			let filePath = getSymlinikFilePath(originFilePath, checkPathCmd)
			console.log(`Path of realpath is ${filePath}`);
			let uri = vscode.Uri.file(filePath);
			console.log(`URI path is ${uri}`);
			vscode.commands.executeCommand('vscode.openFolder', uri)
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
