// 统计单个卡池中的抽卡结果，兼容数据库字段与旧抓取字段
const { isUpItem } = require('./isUpItem')

function getQualityLevel(record) {
    return Number(record.quality_level ?? record.qualityLevel ?? 0);
}

function getResourceName(record) {
    return record.resource_name ?? record.name ?? null;
}

function getIsUp(record) {
    if (Object.prototype.hasOwnProperty.call(record, 'is_up')) {
        return record.is_up === null ? null : Boolean(record.is_up);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'isUp')) {
        return record.isUp === null ? null : Boolean(record.isUp);
    }

    return isUpItem({
        qualityLevel: getQualityLevel(record),
        resourceId: record.resource_id ?? record.resourceId
    });
}

function sortRecordsForAnalyze(records) {
    //检查是否已存在draw_order字段
    const hasDrawOrder = records.some(record =>
        record.draw_order !== undefined && record.draw_order !== null
    );

    if (hasDrawOrder) {
        return records.slice().sort((a, b) => Number(a.draw_order ?? 0) - Number(b.draw_order ?? 0));
    }//若存在draw_order字段，则按该字段排序

    const hasDbTimeFields = records.some(record =>
        record.time !== undefined || record.in_second_seq !== undefined
    );

    if (hasDbTimeFields) {
        return records.slice().sort((a, b) => {
            const timeDiff = new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime();
            if (timeDiff !== 0) {
                return timeDiff;
            }

            return Number(a.in_second_seq ?? 0) - Number(b.in_second_seq ?? 0);
        });
    }

    // 官方接口原始返回通常是最新在前。
    return records.slice().reverse();
}

function analyzePool(records) {
    const theTotal = records.length;//设定参数为纯数组，优化接口结构
    let fiveStarCount = 0;

    let pity = 0;//当前总抽数
    const pityList = [];//记录每次出金的抽数（到当前抽数）
    let upCount = 0;//记录限定数量

    let currentUpSeries = 0;//当前连续赢50/50次数
    let currentNotupSeries = 0;//当前连续输50/50次数
    let maxUpSeries = 0;//最大连续赢50/50次数
    let maxNotupSeries = 0;//最大连续输50/50次数
    let guaranteedUp = false;//上一金歪了后，下一金是否处于大保底

    const orderedRecords = sortRecordsForAnalyze(records);

    for (const record of orderedRecords) {
        pity++;

        if (getQualityLevel(record) === 5) {
            fiveStarCount++;

            const isUp = getIsUp(record);
            if (isUp === true) {
                upCount++;
                if (guaranteedUp) {
                    guaranteedUp = false;
                } else {
                    currentUpSeries++;
                    currentNotupSeries = 0;
                    maxUpSeries = Math.max(maxUpSeries, currentUpSeries);
                }
            } else if (isUp === false) {
                currentNotupSeries++;
                currentUpSeries = 0;
                maxNotupSeries = Math.max(maxNotupSeries, currentNotupSeries);
                guaranteedUp = true;
            } else {
                currentUpSeries = 0;
                currentNotupSeries = 0;
                guaranteedUp = false;
            }

            pityList.push({
                count: pity,
                name: getResourceName(record),
                isUp:isUp
            });

            pity = 0; // 重置出金抽数，新一轮保底开始
        }
    }

    const avgPity = pityList.length ? (pityList.reduce((sum, item) => sum + item.count, 0) / pityList.length) : 0;
    const avgUp = upCount ? ((theTotal - pity) / upCount) : 0;
    const upRate = fiveStarCount ? (upCount / fiveStarCount) : 0;

    return {
        total: theTotal,//总抽数
        fiveStar: fiveStarCount,
        avgPity: avgPity.toFixed(2),//平均出金抽数
        avgUp: avgUp.toFixed(2),//平均up抽数
        upRate: upRate.toFixed(4)*100 + '%',//up率
        pityList,
        "已垫": pity,
        upSeries: maxUpSeries,
        notupSeries: maxNotupSeries
    };
}

module.exports = {
    analyzePool
}
