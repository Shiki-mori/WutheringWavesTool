//分析单个卡池中的数据

const {isUpItem}=require('./isUpItem')

function analyzePool(records) {
    //const theTotal = records.data.length;
    const theTotal = records.length;//设定参数为纯数组，优化接口结构
    let fiveStarCount = 0;
    let fourStarCount = 0;

    // for (const item of records.data) {
    //     if (item.qualityLevel === 5) {
    //         fiveStarCount++;
    //     } else if (item.qualityLevel === 4) {
    //         fourStarCount++;
    //     }
    // }

    let pity = 0;//当前总抽数
    let pityList = [];//记录每次出金的抽数（到当前抽数）

    records = records.reverse();

    for (const record of records) {
        pity++;

        if (record.qualityLevel === 5) {
            
            fiveStarCount++;
            const isUp = isUpItem(record.resourceId);

            pityList.push({
                count: pity,
                name: record.name,
                isUp: isUp
            });

            pity = 0; // 重置出金抽数，新一轮保底开始
        }
        else if (record.qualityLevel === 4) {
            fourStarCount++;
        }
    }

    const avgPity = pityList.length ? (pityList.reduce((sum, item) => sum + item.count, 0) / pityList.length) : 0;

    return {
        total: theTotal,
        fiveStar: fiveStarCount,
        fourStar: fourStarCount,
        avgPity: avgPity,
        pityList,
        "已垫": pity
    };
}

module.exports = {
    analyzePool
};