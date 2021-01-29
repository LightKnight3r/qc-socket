const async = require('async');
const config = require('config')
const rp = require('request-promise')
const CONSTANTS = require('../const')

class NotifyManager {
  sendToMember(id, title, description, data) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        uri: `${config.serviceAddr.pushNotify}/api/v1.0/push-notification/member`,
        body: {
            userId: id,
            title: title,
            message: description,
            data: data
        },
        json: true // Automatically stringifies the body to JSON
      }

      rp(options)
        .then((result) => {
          if(result.code === 501) {
            return reject(new Error(`Not found token inf`))
          }

          if((result.code === CONSTANTS.CODE.FAIL) || (result.code === CONSTANTS.CODE.SYSTEM_ERROR)) {
            return reject(new Error(`Push to user failed`))
          }

          resolve(result);
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
module.exports = new NotifyManager
