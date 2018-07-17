'use strict'

// Import parts of electron to use
const { app, BrowserWindow, ipcMain, shell, Menu, dialog} = require('electron')
const child = require('child_process').exec
const path = require('path')
const url = require('url')
const fs = require('fs');
const dirSearch = require('./src/components/modules/readDir')
const imageSearch = require('image-search-google');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let currentDir = __dirname;
const rootDirectory = __dirname;
//image search info
let credentials = {
  cseId: '015378869116677761611:ec-bri_zm-y',
  apiKey: 'AIzaSyD-1JTuzRfDmn1E_vEpzfQ7qX0QMuNkiAs'
}

let imageUrls = []
const imgClient = new imageSearch(credentials.cseId, credentials.apiKey);
var options = {
  page: 1,
  disableWebSearch: true
}
// Keep a reference for dev mode
let dev = false

if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true
}

// Temporary fix broken high-dpi scale factor on Windows (125% scaling)
// info: https://github.com/electron/electron/issues/9691
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', 'true')
  app.commandLine.appendSwitch('force-device-scale-factor', '1')
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false
  })

  // and load the index.html of the app.
  let indexPath

  if (dev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true
    })
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    })
  }

  mainWindow.loadURL(indexPath)

  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);
  
  createImgsDir();
  getStateReady();
  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Open the DevTools automatically if developing
    if (dev) {
      mainWindow.webContents.openDevTools()
    }
  })
  
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

const menuTemplate = [
  {
    label: 'File',
    submenu:[
      {
        label: 'Change Directory',
        click() {
          onOpen();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin'? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  }
];

//open files
ipcMain.on('openfile', function(event, arg) { 
  let filePath = arg.replace(/\\/g, "\\\\");
  shell.openItem(filePath);
  event.returnValue = filePath;
});

//Load file directory and getImg urls before sending to ipcRenderer
function getStateReady() {
  let pdfFiles = scanDirectory(currentDir);
  let pdfNames = getPdfName(pdfFiles);
  imageUrls = getImgName(pdfFiles);
  console.log(imageUrls);
  createImg(pdfFiles, pdfNames);
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ping', pdfFiles, imageUrls);
  })
}
//get img names
function getImgName(unfilteredNames) {
  let filteredNames = unfilteredNames.map(name => {
    name = name.substring(name.lastIndexOf('\\') + 1, name.length);
    return name.replace('.pdf', '.jpg');
  });
  return filteredNames;
}

//scan current directory for pdf files only. use readDir module
function scanDirectory(directory) {
  let filteredFiles = dirSearch(directory, '.pdf')
  return filteredFiles;
}

//get rid of all the extra file info and returns array of pdf names
function getPdfName(unfilteredNames) {
  let filteredNames = unfilteredNames.map(name => {
    name = name.substring(name.lastIndexOf('\\') + 1, name.length);
    return name.replace(' ', '_');
  });
  return filteredNames;
}

function createImg(pdfPaths, pdfNames) {
  pdfNames.forEach((item, index)=> {
    if(fs.existsSync(path.join(rootDirectory, 'src', 'imgs', item.replace('.pdf', '.jpg')))) {
      console.log('image exists');
    } 
    else {
      console.log("creating image");
      child(returnProcess(pdfPaths[index], item), (err, stdout) => {
        if(err) {
          console.log(err)
        }
        console.log(stdout)
      }) 
    }
  })
}

function returnProcess(pdfPath, pdfName) {
  let newPdf = pdfPath;
  let output = path.join(rootDirectory, 'src', 'imgs', pdfName.replace('.pdf', '.jpg'));
  let mainProcess = `"C:\\Program Files\\gs\\gs9.23\\bin\\gswin64c.exe" -q -o ${output} -sDEVICE=pngalpha -dLastPage=1 ${newPdf}`

  return mainProcess;
}

//make imgs folder in the root of the app
function createImgsDir() {
  if(fs.existsSync(path.join(__dirname, 'src', 'imgs'))) {
    console.log('directory already exists');
  }
  else {
    fs.mkdirSync(path.join(__dirname, 'src', 'imgs'));  
  }
}
//Image client: gets the urls of the images using google custom search api 
/* function getImgUrls(searchItems) {
  return Promise.all(searchItems.map(currentItem => {
    return imgClient.search(currentItem, options).then(images => {
      //  make the url be the resolved value of the promise
      return images[0].url; 
    });
  }));
} */

//called when change directory menu is clicked
function onOpen() {
  dialog.showOpenDialog({properties: ['openDirectory']}, (filePath) => {
    currentDir = String(filePath);
    getStateReady();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
