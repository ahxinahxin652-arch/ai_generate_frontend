// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const serverApp = require('./server/app'); // 引入转换后的 Express 服务器

const PORT = 5000;
let mainWindow;
let expressServer;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 在开发环境下加载本地 Vue 服务，生产环境下加载打包好的静态文件
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(() => {
    // 1. 启动本地 Express 接口服务器
    expressServer = serverApp.listen(PORT, () => {
        console.log(`[Backend] Local server running on http://127.0.0.1:${PORT}`);
    });

    // 2. 创建 Electron 窗口
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (expressServer) {
        expressServer.close();
    }
});