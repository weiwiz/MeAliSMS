var log4js = require('log4js');
var errJSON = require('./error-code.json');
var errLangdefault = errJSON.getErrLang;
var allErrcode = [];
function showAll(errJSON) {
    inited = true;
    for (var e in errJSON) {
        for (var ex in errJSON[e]) {
            if (ex === 'errors') {
                allErrcode = allErrcode.concat(errJSON[e].errors);
            }
            if ('object' === typeof(errJSON[e][ex])) {
                showAll(errJSON[e][ex]);
            }
        }
    }
}

function getErrorInfo(code, lang) {
    lang = lang || errLangdefault;
    for (var i = 0; i < allErrcode.length; i++) {
        if (allErrcode[i].errorId === code) {
            return allErrcode[i].errorMsg[lang];
        }
    }
    return "unknown error.";
}
var LOG_CONFIG = {
    "appenders": {
        "access": {
            "type": "dateFile",
            "filename": "log/access.log",
            "absolute": true,
            "pattern": "-yyyy-MM-dd"
        },
        "rule-console": {
            "type": "console"
        },
        "rule-file": {
            "type": "dateFile",
            "filename": "log/M-Cloud_",
            "absolute": true,
            "encoding": "utf-8",
            "maxLogSize": 10000000,
            "numBackups": 3,
            "pattern": "yyyy-MM-dd.log",
            "alwaysIncludePattern": true
        }
    },
    "categories": {
        "default": {
            "appenders": [
                "rule-console",
                "rule-file"
            ],
            "level": "debug"
        },
        "http": {
            "appenders": [
                "access"
            ],
            "level": "info"
        }
    }
};
log4js.configure(LOG_CONFIG);
var mLogger = log4js.getLogger("rule-file");
var handleLog = function (info) {
    mLogger.log(info);
};
var handleTrace = function (info) {
    mLogger.trace(info);
};
var handleDebug = function (info) {
    mLogger.debug(info);
};
var handleInfo = function (info) {
    mLogger.info(info);
};
var handleWarn = function (info) {
    mLogger.warn(info);
};
var handleError = function (code, info) {
    var error = {
        errId: code,
        errMsg: getErrorInfo(code),
        detail: info
    };
    mLogger.error(error);
};
var handleException = function (code, info) {
    var error = {
        errId: code,
        errMsg: getErrorInfo(code),
        detail: info
    };
    mLogger.error(error);
};
module.exports = {
    getErrorInfo: getErrorInfo,
    log: handleLog,
    trace: handleTrace,
    debug: handleDebug,
    info: handleInfo,
    warn: handleWarn,
    error: handleError,
    exception: handleException
};