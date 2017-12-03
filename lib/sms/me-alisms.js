/**
 * Created by jacky on 2017/2/4.
 */
'use strict';
var util = require('util');
var aliConf = require('./config.js').Ali;
var aliSMS = require('@alicloud/sms-sdk');
var sendInterval = require('./config.js').Interval;
var logger = require('./../mlogger/mlogger');
var VirtualDevice = require('./../virtual-device').VirtualDevice;
var OPERATION_SCHEMAS = {
    sendMessage: {
        "type": "object",
        "properties": {
            "PhoneNumbers": {"type": "string"},
            "SignName": {"type": "string"},
            "TemplateCode": {"type": "string"},
            "TemplateParam": {"type": "string"}
        },
        "required": ["PhoneNumbers", "SignName", "TemplateCode", "TemplateParam"]
    }
};

function AliSMS(conx, uuid, token, configurator) {
    this.client = null;
    this.sendHistory = {};
    VirtualDevice.call(this, conx, uuid, token, configurator);
}
util.inherits(AliSMS, VirtualDevice);

AliSMS.prototype.init = function () {
    this.client = new aliSMS({accessKeyId: aliConf.AccessKeyId, secretAccessKey: aliConf.SecretAccessKey});
};

/**
 * 远程RPC回调函数
 * @callback onMessage~sendMessage
 * @param {object} response:
 * {
 *      "retCode":{number},
 *      "description":{string},
 *      "data":{object}
 *  }
 */
/**
 * 发送短信
 * @param {object} message :消息体
 * @param {onMessage~sendMessage} peerCallback: 远程RPC回调函数
 * */
AliSMS.prototype.sendMessage = function (message, peerCallback) {
    var self = this;
    var responseMessage = {retCode: 200, description: "Success.", data: {}};
    self.messageValidate(message, OPERATION_SCHEMAS.sendMessage, function (error) {
        if (error) {
            responseMessage = error;
            peerCallback(error);
        }
        else {
            var messageInfo = message;
            var sendDate = new Date();
            logger.debug(sendDate.getTime() - self.sendHistory[messageInfo.PhoneNumbers]);
            if (!util.isNullOrUndefined(self.sendHistory[messageInfo.PhoneNumbers])) {
                if (sendDate.getTime() - self.sendHistory[messageInfo.PhoneNumbers] <= sendInterval * 1000) {
                    logger.error(210001);
                    responseMessage.retCode = 210001;
                    responseMessage.description = logger.getErrorInfo(210001);
                    peerCallback(responseMessage);
                    return;
                }
            }
            else {
                self.sendHistory[messageInfo.PhoneNumbers] = sendDate.getTime();
            }
            self.client.sendSMS(messageInfo).then(function (res) {
                if (res.Code === 'OK') {
                    logger.debug(res);
                }
                else {
                    logger.error(210002, res);
                    responseMessage.retCode = 210002;
                    responseMessage.description = res;
                }
                peerCallback(responseMessage);
            }, function (error) {
                if (error) {
                    var logError = {
                        errorId: 210002, errorMsg: error
                    };
                    logger.error(210002, error);
                    responseMessage.retCode = logError.errorId;
                    responseMessage.description = logError.errorMsg;
                }
                console.log(error);
                peerCallback(responseMessage);
            });
        }
    });
};

module.exports = {
    Service: AliSMS,
    OperationSchemas: OPERATION_SCHEMAS
};