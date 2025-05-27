"use strict";
const electron = require("electron");
const api = {};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", {
      send: (channel, data) => electron.ipcRenderer.send(channel, data),
      on: (channel, func) => {
        electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
      },
      invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args)
      // Add any other specific APIs from electronAPI if they were being used
    });
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = {
    send: (channel, data) => electron.ipcRenderer.send(channel, data),
    on: (channel, func) => {
      electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args)
  };
  window.api = api;
}
