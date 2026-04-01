//分析单个卡池中的数据

const { isUpItem } = require('./isUpItem')

function analyzePool(records) {
    const theTotal = records.length;//设定参数为纯数组，优化接口结构
    let fiveStarCount = 0;

    let pity = 0;//当前总抽数
    let pityList = [];//记录每次出金的抽数（到当前抽数）
    let upCount = 0;//记录限定数量

    let upSeries = 0;//记录连续up次数
    let notupSeries = 0;//记录连歪次数
    let upSeriesList = [];//记录连续up次数列表
    let notupSeriesList = [];//记录连歪次数列表

    //records = records.reverse();  //reverse()会直接修改records。如果后续需使用records可能发生危险。
    records = records.slice().reverse();

    for (const record of records) {
        pity++;

        if (record.qualityLevel === 5) {

            fiveStarCount++;

            const isUp = isUpItem(record);
            if (isUp === true) {
                upCount++;
                upSeries++;
                if (notupSeries > 0) {
                    notupSeriesList.push(notupSeries);
                    notupSeries = 0;
                } else {
                    notupSeries++;
                    if (upSeries > 0) {
                        upSeriesList.push(upSeries);
                        upSeries = 0;
                    }
                }
            }

            pityList.push({
                count: pity,
                name: record.name,
                isUp: isUp
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
        upRate: upRate.toFixed(4),//up率
        pityList,
        "已垫": pity,
        upSeries: upSeriesList.length ? Math.max(...upSeriesList) : 0,
        notupSeries: notupSeriesList.length ? Math.max(...notupSeriesList) : 0
    };
}

module.exports = {
    analyzePool
}
