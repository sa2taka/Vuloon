var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  disableProxy: () => disableProxy,
  enableProxy: () => enableProxy,
  setProxy: () => setProxy
});
var import_sudo_prompt = __toModule(require("sudo-prompt"));
async function setProxy(port) {
  const sanitized = sanitizeForCmd(port.toString());
  return new Promise((resolve) => {
    (0, import_sudo_prompt.exec)(`reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyServer /t reg_sz /d "localhost:${sanitized}"`, { name: "Vuloon" }, (err, stdout) => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
}
async function enableProxy() {
  return new Promise((resolve) => {
    (0, import_sudo_prompt.exec)(`reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyEnable /t reg_dword /d 1`, { name: "Vuloon" }, (err, stdout) => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
}
async function disableProxy() {
  return new Promise((resolve) => {
    (0, import_sudo_prompt.exec)(`reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyEnable /t reg_dword /d 0`, { name: "Vuloon" }, (err, stdout) => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
}
function sanitizeForCmd(str) {
  return `"${str.replaceAll('\\"', '\\\\"').replaceAll('"', '\\"').replaceAll("%", "^%").replace(/\\$/, "\\\\")}"`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  disableProxy,
  enableProxy,
  setProxy
});
