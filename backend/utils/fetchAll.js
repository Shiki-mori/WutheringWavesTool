//该函数的作用是将parseGachaUrl返回的部分查询参数与卡池type参数组合，返回一个数组，数组中的每个元素都对应一条完整的查询参数
const { parseGachaUrl } = require("./parseUrl")

function fetchAll(url) {
    const parsed = parseGachaUrl(url);

    const baseInfo = {
        playerId: parsed.playerId,
        serverId: parsed.serverId,
        recordId: parsed.recordId,
        cardPoolId: parsed.cardPoolId,
        languageCode: parsed.languageCode
    };

    const poolTypes = [1, 2, 3, 4, 5, 6, 8, 9];

    const payloads = [];

    for (const poolType of poolTypes) {//poolType是poolTypes数组中的每个元素
        payloads.push({
            ...baseInfo,
            cardPoolType: poolType
        });//将baseInfo对象中的属性展开，并添加一个新的属性cardPoolType，其值为当前的poolType。然后将这个新对象添加到payloads数组中。
    }

    return payloads;
}

module.exports = {
    fetchAll
};//导出fetchAll函数，使其可以在其他文件中被引入和使用。