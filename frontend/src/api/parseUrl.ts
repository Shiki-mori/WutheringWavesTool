// parseUrl.js
export const parseGachaUrl = (fullUrl) => {
    try {
        const urlObj = new URL(fullUrl.replace('#/record', '')); // 处理掉 hash 部分方便解析
        const params = urlObj.searchParams;

        return {
            serverId: params.get('svr_id'),
            playerId: params.get('player_id'),
            cardPoolId: params.get('resources_id'), // 注意这里：url里叫resources_id，API里叫cardPoolId
            cardPoolType: parseInt(params.get('gacha_type')),
            languageCode: params.get('lang'),
            recordId: params.get('record_id')
        };
    } catch (e) {
        console.error('URL 解析失败', e);
        return null;
    }
};