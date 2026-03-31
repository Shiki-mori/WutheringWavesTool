const { fetchQueryParams } = require('../utils/fetchQueryParams');
const { fetchRecords } = require('../utils/fetchRecords');
const { saveRecords } = require('../utils/saveRecords');

async function fetchAndSave(url) {
    let queryParams = await fetchQueryParams(url);
    let data = await fetchRecords(queryParams);

    await saveRecords(data);

    return data;
}

module.exports = {
    fetchAndSave
};