//分析单个卡池中的数据
function analyzePool(poolData) {
    const theTotal = poolData.data.length;
    let fiveStarCount = 0;
    let fourStarCount = 0;

    for (const item of poolData.data) {
        if (item.qualityLevel === 5) {
            fiveStarCount++;
        } else if (item.qualityLevel === 4) {
            fourStarCount++;
        }
    }

    return {
        total: theTotal,
        fiveStar: fiveStarCount,
        fourStar: fourStarCount
    };
}

module.exports = {
    analyzePool
};