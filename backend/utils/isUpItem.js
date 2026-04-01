//判断是否为up角色
const { PERMANENT_CHARACTERS } = require('../config/permanentConfig');

function isUpItem(record) {
    if (record.qualityLevel === 5) {
        if (PERMANENT_CHARACTERS.includes(Number(record.resourceId))) {
            //console.log('record.resourceId:', record.resourceId);
            return false;
        }
        return true;
    }
    else return null;
}
module.exports = {
    isUpItem
};