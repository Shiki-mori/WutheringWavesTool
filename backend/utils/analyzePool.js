// 统计单个卡池中的抽卡结果，兼容数据库字段与旧抓取字段
const { isUpItem } = require('./isUpItem')

function getQualityLevel(record) {
    return Number(record.quality_level ?? record.qualityLevel ?? 0);
}

function getResourceName(record) {
    return record.resource_name ?? record.name ?? null;
}

function getIsUp(record) {
    if (record.is_up !== undefined && record.is_up !== null) {
        return Boolean(record.is_up);
    }

    if (record.isUp !== undefined && record.isUp !== null) {
        return Boolean(record.isUp);
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

    let upSeries = 0;//记录连续up次数
    let notupSeries = 0;//记录连歪次数
    const upSeriesList = [];//记录连续up次数列表
    const notupSeriesList = [];//记录连歪次数列表

    const orderedRecords = sortRecordsForAnalyze(records);

    for (const record of orderedRecords) {
        pity++;

        if (getQualityLevel(record) === 5) {
            fiveStarCount++;

            const isUp = getIsUp(record);
            if (isUp === true) {
                upCount++;
                upSeries++;
                if (notupSeries > 0) {
                    notupSeriesList.push(notupSeries);
                    notupSeries = 0;
                }
            } else if (isUp === false) {
                notupSeries++;
                if (upSeries > 0) {
                    upSeriesList.push(upSeries);
                    upSeries = 0;
                }
            }

            pityList.push({
                count: pity,
                name: getResourceName(record),
                isUp:isUp
            });

            pity = 0; // 重置出金抽数，新一轮保底开始
        }
    }

    upSeriesList.push(upSeries);//仅在up状态转换时记录。因此需要在循环结束后添加。
    notupSeriesList.push(notupSeries);

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
        upSeries: upSeriesList.length ? Math.max(...upSeriesList) : 0,
        notupSeries: notupSeriesList.length ? Math.max(...notupSeriesList) : 0
    };
}

module.exports = {
    analyzePool
}
