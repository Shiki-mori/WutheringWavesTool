//判断是否为up角色
const {PERMANENT_CHARACTERS}=require('../config/permanentConfig');

function isUpItem(resourceId) {
    if (PERMANENT_CHARACTERS.includes(Number(resourceId))){
        return false;
    }
    return true;
}

module.exports = {
    isUpItem
};