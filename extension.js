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

  function systemSync(cmd) {
    return child_process.execSync(cmd).toString();
  }

  function isPowershell() {
    try {
      systemSync('Get-Host')
      return true;
    }
    catch (error) {
      return false;
    }
  }

  function getWindowsPathCheck(winPath) {
    if (isPowershell()) {
      return systemSync(`cmd /c "dir ${winPath}"`);
    }
    else {
      return systemSync(`dir ${winPath}`);
    }
  }

  let disposable = vscode.commands.registerCommand('goToSymbolicLink', fs => {
    // The code you place here will be executed every time your command is executed
    const originFilePath = fs.path;
    let fullSourcePath = originFilePath;
    if (isWin) {
      // Windows flow
      const withoutFirstSlash = originFilePath.replace(/^\/+/, '');
      // Replace all "/" with "\"
      const winPath = withoutFirstSlash.replace(/\//g, '\\');

      let checkPathCmd = getWindowsPathCheck(winPath);
      if (checkPathCmd.includes('<SYMLINK>')) {
        const pattern = /<SYMLINK>\s+(.*)\s+\[([^[\]]+)\]/;

        const match = winPath.match(pattern);
        if (match) {
          const symbolicLink = match[1];
          const targetPath = match[2];
          console.log("Symbolic Link:", symbolicLink);
          console.log("Target Path:", targetPath);

          if (!targetPath.includes(":")) {
            fullSourcePath = winPath.replace(symbolicLink, targetPath)
          } else {
            fullSourcePath = targetPath;
          }
        }
      }
    } else {
      // UNIX flow
      let checkPathCmd = systemSync(`ls -l ${originFilePath}`);
      if (checkPathCmd.includes(' -> ')) {
        let shellExec = systemSync(`realpath ${originFilePath}`);
        fullSourcePath = shellExec.replace(/[\r\n]/gm, '');
        console.log(`Path of realpath is ${fullSourcePath}`);
      }
      let uri = vscode.Uri.file(fullSourcePath);
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