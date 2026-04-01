// 该文件包含一些预处理逻辑，返回包含完整信息的record，方便saveRecords读取。 

// 为每条记录添加gachaIndex属性
function add_gachaIndex(records) {
    const total = records.length;
    return records.map((record, index) => ({
        ...record,//...表示展开record对象的所有属性
        // 官方接口按时间倒序返回，这里补充对应的历史抽数序号。
        gachaIndex: total - index
    }));
}

// 为每条记录添加isUp属性
const { isUpItem } = require('./isUpItem')

function add_isUp(records) {
    return records.map(record => ({
        ...record,
        isUp: isUpItem(record)
    }));
}

// 为每条记录添加参数
function add_params(records) {
    return add_gachaIndex(add_isUp(records));
}

module.exports = {
    add_gachaIndex,
    add_isUp,
    add_params
};
