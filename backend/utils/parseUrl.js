// 该函数接受一个URL字符串作为输入，尝试解析出其中的查询参数，并返回一个包含这些参数的对象。函数首先创建一个URL对象来解析输入的URL字符串，然后使用searchParams属性获取查询特定的参数，如serverId、playerId、cardPoolId、cardPoolType、languageCode和recordId，并将它们组织成一个对象返回。
// 解析层
function parseGachaUrl(url) {
    try {
        const urlObj = new URL(url.replace('#/record', '')); // 处理掉 hash 部分方便解析
        const params = urlObj.searchParams;

        const gachaType = params.get('gacha_type');

        return {
            serverId: params.get('svr_id'),
            playerId: params.get('player_id'),
            recordId: params.get('record_id'),
            cardPoolId: params.get('resources_id'),
            languageCode: params.get('lang')
        };
    } catch (e) {
        console.error('URL 解析失败', e);
        return null;
    }
}
module.exports = {
    parseGachaUrl
};//导出parseGachaUrl函数，使其可以在其他文件中被引入和使用。
