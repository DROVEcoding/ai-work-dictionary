const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const isSmokeTest = process.argv.includes("--smoke-test");

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    show: !isSmokeTest,
    title: "AI Work Dictionary",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 桌面版复用现有网页入口，避免同时维护两套界面。
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"))
    .then(() => {
      if (isSmokeTest) {
        app.quit();
      }
    })
    .catch(() => {
      if (isSmokeTest) {
        process.exitCode = 1;
        app.quit();
      }
    });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
