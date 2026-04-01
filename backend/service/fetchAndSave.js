const { fetchQueryParams } = require('../utils/fetchQueryParams');
const { fetchRecords } = require('../utils/fetchRecords');
const { add_params } = require('../utils/preProcessing');
const { saveRecords } = require('../utils/saveRecords');

async function fetchAndSave(url) {
    let queryParams = await fetchQueryParams(url);// 获取查询参数
    let data = await fetchRecords(queryParams);// 获取记录数据
    const processedData = data.map(group => ({
        ...group,
        records: add_params(group.records ?? [])
    }));

    await saveRecords(processedData);

    console.log('数据获取和保存完成');

    return processedData;
}

module.exports = {
    fetchAndSave
};
