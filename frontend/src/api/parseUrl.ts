// parseUrl.js
export const parseGachaUrl = (fullUrl: string): {
    serverId: string | null;
    playerId: string | null;
    cardPoolId: string | null;
    cardPoolType: number | null;
    languageCode: string | null;
    recordId: string | null;
} | null => {
    try {
        const urlObj = new URL(fullUrl.replace('#/record', '')); // 处理掉 hash 部分方便解析
        const params = urlObj.searchParams;

        const gachaType = params.get('gacha_type');

        return {
            serverId: params.get('svr_id'),
            playerId: params.get('player_id'),
            cardPoolId: params.get('resources_id'), // 注意这里：url里叫resources_id，API里叫cardPoolId
            cardPoolType: gachaType ? parseInt(gachaType, 10) : null,
            languageCode: params.get('lang'),
            recordId: params.get('record_id')
        };
    } catch (e) {
        console.error('URL 解析失败', e);
        return null;
    }
};
