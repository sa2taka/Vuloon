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
  encodeRequestData: () => encodeRequestData,
  parse: () => parse,
  parseReuqestData: () => parseReuqestData
});
var import_console = __toModule(require("console"));
var import_iconv_lite = __toModule(require("iconv-lite"));
var import_querystring = __toModule(require("querystring"));
var import_zlib = __toModule(require("zlib"));
const CONTENT_TYPES = ["x-gzip", "gzip", "compress", "deflate", "identity", "br"];
const BINARY_CONTENT_TYPES = [/^application\/octet-stream/, /^image\/[^\s;]+/, /'video\/[^\s;]+/, /audio\/[^\s;]+/];
function parse(body, headers) {
  const encoding = headers["content-encoding"];
  const contentType = headers["content-type"];
  const decodedBody = parseEncode(body, encoding);
  return parseContent(decodedBody, contentType);
}
function parseReuqestData(body, headers) {
  const contentType = headers["content-type"]?.toLowerCase();
  if (contentType?.match(/^application\/x-www-form-urlencoded/)) {
    return parseForUrlEncoded(body, headers);
  }
  if (contentType?.match(/^multipart\/form-data/)) {
    return parseForFormData(body, headers);
  }
  if (contentType?.match(/^application\/json/)) {
    return parseForJson(body, headers);
  }
  return parse(body, headers);
}
function encodeRequestData(data, contentType) {
  if (data.type === "binary") {
    return data.value;
  }
  if (data.type === "string") {
    return Buffer.from(data.value);
  }
  if (data.type === "urlencoded") {
    return Buffer.from(encodeToUrlEncoded(data.value));
  }
  if (data.type === "formdata") {
    const boundary = contentType?.match(/boundary\s*=\s*([^\s;]+)/);
    (0, import_console.assert)(boundary);
    return encodeToFormData(data.value, boundary[1]);
  }
  if (data.type === "json") {
    return Buffer.from(encodeToJson(data.value));
  }
  return Buffer.from("");
}
function parseForUrlEncoded(body, headers) {
  const parsed = parse(body, headers);
  if (parsed.type === "string") {
    return { type: "urlencoded", value: (0, import_querystring.parse)(parsed.value) };
  } else {
    return parsed;
  }
}
function parseForFormData(body, headers) {
  const contentType = headers["content-type"];
  (0, import_console.assert)(contentType);
  const boundary = contentType?.match(/boundary\s*=\s*([^\s;]+)/);
  (0, import_console.assert)(boundary);
  const divided = divideByBoundary(body, boundary[1]);
  const partData = [];
  divided.forEach((data) => {
    const parsed = parseFormDataPart(data);
    const sameNameForm = partData.find((part) => part.key === parsed.key);
    if (sameNameForm && typeof parsed.value === "string" && !(sameNameForm.value instanceof Buffer)) {
      sameNameForm.value = [sameNameForm.value, parsed.value].flat();
    } else {
      partData.push(parsed);
    }
  });
  return { type: "formdata", value: partData };
}
function divideByBoundary(body, boundary) {
  const startRawBoundary = Buffer.from("--" + boundary + "\r\n");
  const endRawBoundary = Buffer.from("\r\n--" + boundary);
  const parsed = [];
  let firstIndex = 0;
  while (body.includes(startRawBoundary, firstIndex)) {
    const dataStart = body.indexOf(startRawBoundary, firstIndex) + startRawBoundary.byteLength;
    const dataEnd = body.indexOf(endRawBoundary, dataStart);
    if (!(dataEnd && dataEnd !== -1)) {
      const endData = body.slice(dataStart, dataStart + 2);
      if (endData.equals(new Uint8Array([45, 45]))) {
        break;
      } else {
        throw new Error("Unexpected end of multipart data");
      }
    }
    parsed.push(body.slice(dataStart, dataEnd));
    firstIndex = dataEnd;
  }
  return parsed;
}
function parseFormDataPart(partData) {
  const headerDivider = Buffer.from("\r\n\r\n");
  const dividedPoint = partData.indexOf(headerDivider);
  const headerBuffer = partData.slice(0, dividedPoint);
  const dataBuffer = partData.slice(dividedPoint + 4);
  const headerText = parseToText(headerBuffer);
  const headerParser = /^(?<header>[^:\r\n]+):\s+(?<value>(.+))$/gm;
  const headers = [...headerText.matchAll(headerParser)].map((r) => r.groups);
  if (!headers) {
    throw new Error("Unexpected multipart header");
  }
  const contentDisposition = headers.find((h) => h["header"].toLowerCase() === "content-disposition");
  if (!contentDisposition) {
    throw new Error("Unexpected multipart header");
  }
  const name = contentDisposition["value"].match(/name\s*=\s*"([^"]+)"/);
  if (!name) {
    throw new Error("Unexpected multipart header");
  }
  const filename = contentDisposition["value"].match(/filename\s*=\s*"([^"]+)"/);
  const filenameAster = contentDisposition["value"].match(/filename\*\s*=\s*"([^"]+)"/);
  const contentType = headers.find((h) => h["header"].toLowerCase() === "content-type");
  const { value } = parseContent(dataBuffer, contentType?.value);
  return {
    key: name[1],
    value,
    filename: filename ? filename[1] : void 0,
    filenameAster: filenameAster ? filenameAster[1] : void 0,
    rawHeader: headerText
  };
}
function parseForJson(body, headers) {
  const parsed = parse(body, headers);
  try {
    if (parsed.type === "string") {
      return { type: "json", value: JSON.parse(parsed.value) };
    } else {
      return parsed;
    }
  } catch (_) {
    return parsed;
  }
}
function encodeToUrlEncoded(data) {
  return (0, import_querystring.stringify)(data);
}
function encodeToFormData(data, boundary) {
  let retBuffer = Buffer.from("");
  data.forEach((form) => {
    if (typeof form.value === "string") {
      retBuffer = Buffer.concat([
        retBuffer,
        Buffer.from(`--${boundary}\r
`),
        Buffer.from(form.rawHeader),
        Buffer.from("\r\n\r\n"),
        Buffer.from(form.value)
      ]);
    } else if (form.value instanceof Buffer) {
      retBuffer = Buffer.concat([
        retBuffer,
        Buffer.from(`--${boundary}\r
`),
        Buffer.from(form.rawHeader),
        Buffer.from("\r\n\r\n"),
        form.value
      ]);
    } else {
      form.value.forEach((v) => {
        retBuffer = Buffer.concat([
          retBuffer,
          Buffer.from(`--${boundary}\r
`),
          Buffer.from(form.rawHeader),
          Buffer.from("\r\n\r\n"),
          Buffer.from(v),
          Buffer.from("\r\n")
        ]);
      });
    }
    retBuffer = Buffer.concat([retBuffer, Buffer.from("\r\n")]);
  });
  retBuffer = Buffer.concat([retBuffer, Buffer.from(`--${boundary}--`)]);
  return retBuffer;
}
function encodeToJson(data) {
  return JSON.stringify(data);
}
function parseEncode(body, encoding) {
  if (!(encoding && CONTENT_TYPES.includes(encoding))) {
    return body;
  }
  switch (encoding) {
    case "x-gzip":
    case "gzip":
    case "deflate":
      return (0, import_zlib.unzipSync)(body);
    case "br":
      return (0, import_zlib.brotliDecompressSync)(body);
    default:
      return body;
  }
}
function parseContent(body, contentType) {
  if (!contentType) {
    return { type: "string", value: parseToText(body) };
  }
  if (BINARY_CONTENT_TYPES.some((regexp) => regexp.test(contentType))) {
    return { type: "binary", value: body };
  }
  const charset = /charset=([^;\s]+)/.exec(contentType)?.[1];
  return { type: "string", value: parseToText(body, charset) };
}
function parseToText(body, charset) {
  const lowerCharset = charset?.toLowerCase();
  return (0, import_iconv_lite.decode)(body, lowerCharset || "utf-8");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  encodeRequestData,
  parse,
  parseReuqestData
});
