
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const isWin = process.platform === "win32";
const vscode = require('vscode');
const fs = require('fs')
const path = require('path');
const outputChannel = vscode.window.createOutputChannel('Open real path', 'rust');
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

  function reverseFileSearch(currentPath, target) {
    // Check if the target file exists in the current directory
    const filePath = path.join(currentPath, target);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  
    // Recursively search files and folders in the current directory
    const filesAndFolders = fs.readdirSync(currentPath);
    for (const item of filesAndFolders) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        const result = reverseFileSearch(itemPath, target);
        if (result) {
          return result;
        }
      }
    }
  
    // Move to the parent path and check for the stopping condition
    const parentPath = path.dirname(currentPath);
    if (parentPath.toLowerCase() === currentPath.substring(0, 3)) {
      return null;
    }
  
    // Recursively search in the parent path
    return reverseFileSearch(parentPath, target);
  }

  let disposable = vscode.commands.registerCommand('goToSymbolicLink', file => {
    // The code you place here will be executed every time your command is executed
    const originFilePath = file.path;
    let fullSourcePath = originFilePath;
    if (isWin) {
      // Windows flow
      const withoutFirstSlash = originFilePath.replace(/^\/+/, '');
      // Replace all "/" with "\"
      const winPath = withoutFirstSlash.replace(/\//g, '\\');
      fullSourcePath = winPath
      let checkPathCmd = getWindowsPathCheck(winPath);
      if (checkPathCmd.includes('<SYMLINK>')) {
        const pattern = /<SYMLINK>\s+(.*)\s+\[([^[\]]+)\]/;

        const match = checkPathCmd.match(pattern);
        if (match) {
          const symbolicLink = match[1];
          const targetPath = match[2];
          console.log("Symbolic Link:", symbolicLink);
          console.log("Target Path:", targetPath);

          if (targetPath.includes(":")) {
          fullSourcePath = targetPath;
        }
        else {
          outputChannel.appendLine(`Starting to recursively find target path of file: ${targetPath}`)
          outputChannel.show()
          const resolvedPath = reverseFileSearch(path.dirname(winPath), targetPath)
          fullSourcePath = resolvedPath;
        }
        }
      }
    }
    else {
      // UNIX flow
      let checkPathCmd = systemSync(`ls -l ${originFilePath}`);
      if (checkPathCmd.includes(' -> ')) {
        let shellExec = systemSync(`realpath ${originFilePath}`);
        fullSourcePath = shellExec.replace(/[\r\n]/gm, '');
        console.log(`Path of realpath is ${fullSourcePath}`);
      }
    }
    if (fs.existsSync(fullSourcePath)) {
      outputChannel.appendLine(`Path of realpath is ${fullSourcePath}`)
      outputChannel.show()
      let uri = vscode.Uri.file(fullSourcePath);
      console.log(`URI path is ${uri}`);
      vscode.commands.executeCommand('vscode.openFolder', uri)
    }
    else {
      outputChannel.appendLine(`Resolved realpath is ${fullSourcePath}`)
      outputChannel.show()
      console.log(`Unable to resolve the symbolic link path ${fullSourcePath}, to an actual path in the system`);
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