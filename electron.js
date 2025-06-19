const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  shell,
  dialog,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater");

// Keep a global reference of the window object
let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "assets/icon.png"),
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    show: false, // Don't show until ready
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  });

  // Load the app
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();

    // Focus on the window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (
      parsedUrl.origin !== "http://localhost:5173" &&
      parsedUrl.origin !== "file://"
    ) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// App event listeners
app.whenReady().then(() => {
  createSplashWindow();

  setTimeout(() => {
    createMainWindow();
    createMenus();

    // Check for updates
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 2000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Create application menus
function createMenus() {
  const template = [
    {
      label: "ملف",
      submenu: [
        {
          label: "مشترك جديد",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/add-member';
            `);
          },
        },
        {
          label: "طباعة",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.print();
            `);
          },
        },
        { type: "separator" },
        {
          label: "إغلاق",
          accelerator: process.platform === "darwin" ? "Cmd+W" : "Ctrl+W",
          click: () => {
            mainWindow.close();
          },
        },
        {
          label: "خروج",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "تحرير",
      submenu: [
        { label: "تراجع", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "إعادة", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "قص", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "نسخ", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "لصق", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "تحديد الكل", accelerator: "CmdOrCtrl+A", role: "selectall" },
      ],
    },
    {
      label: "التنقل",
      submenu: [
        {
          label: "المشتركين",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/members';
            `);
          },
        },
        {
          label: "إضافة مشترك",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/add-member';
            `);
          },
        },
        {
          label: "الكورسات",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/courses';
            `);
          },
        },
        {
          label: "الأنظمة الغذائية",
          accelerator: "CmdOrCtrl+4",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/diet-plans';
            `);
          },
        },
        {
          label: "المبيعات",
          accelerator: "CmdOrCtrl+5",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard/inventory';
            `);
          },
        },
        { type: "separator" },
        {
          label: "إعادة تحميل",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: "إعادة تحميل قسري",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          },
        },
      ],
    },
    {
      label: "عرض",
      submenu: [
        { label: "تكبير", accelerator: "CmdOrCtrl+Plus", role: "zoomin" },
        { label: "تصغير", accelerator: "CmdOrCtrl+-", role: "zoomout" },
        {
          label: "الحجم الأصلي",
          accelerator: "CmdOrCtrl+0",
          role: "resetzoom",
        },
        { type: "separator" },
        { label: "ملء الشاشة", accelerator: "F11", role: "togglefullscreen" },
        {
          label: "أدوات المطور",
          accelerator: "F12",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: "نافذة",
      submenu: [
        { label: "تصغير", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "إغلاق", accelerator: "CmdOrCtrl+W", role: "close" },
      ],
    },
    {
      label: "مساعدة",
      submenu: [
        {
          label: "حول صالة حسام",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "حول صالة حسام",
              message: "صالة حسام لكمال الأجسام",
              detail:
                "نظام إدارة صالة رياضية متكامل\nالإ��دار 1.0.0\n\nتطوير: فريق صالة حسام",
              buttons: ["موافق"],
            });
          },
        },
        {
          label: "التحقق من التحديثات",
          click: () => {
            if (!isDev) {
              autoUpdater.checkForUpdatesAndNotify();
            } else {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "التحديثات",
                message: "لا توجد تحديثات متاحة",
                detail: "أنت تستخدم أحدث إصدار من التطبيق.",
                buttons: ["موافق"],
              });
            }
          },
        },
      ],
    },
  ];

  // macOS menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: "حول " + app.getName(), role: "about" },
        { type: "separator" },
        { label: "خدمات", role: "services", submenu: [] },
        { type: "separator" },
        {
          label: "إخفاء " + app.getName(),
          accelerator: "Command+H",
          role: "hide",
        },
        {
          label: "إخفاء الآخرين",
          accelerator: "Command+Shift+H",
          role: "hideothers",
        },
        { label: "إظهار الكل", role: "unhide" },
        { type: "separator" },
        { label: "إنهاء", accelerator: "Command+Q", click: () => app.quit() },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Auto updater events
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available.");
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "تحديث متاح",
    message: "يتوفر تحديث جديد للتطبيق",
    detail: "سيتم تنزيل التحديث في الخلفية.",
    buttons: ["موافق"],
  });
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available.");
});

autoUpdater.on("error", (err) => {
  console.log("Error in auto-updater. " + err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  console.log(log_message);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");
  dialog
    .showMessageBox(mainWindow, {
      type: "info",
      title: "تحديث جاهز",
      message: "تم تنزيل التحديث بنجاح",
      detail: "سيتم إعادة تشغيل التطبيق لتطبيق التحديث.",
      buttons: ["إعادة التشغيل الآن", "لاحقاً"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

// IPC handlers
ipcMain.handle("app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});

// Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
