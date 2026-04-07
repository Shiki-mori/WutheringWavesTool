import type { AxiosResponse } from 'axios'
import request from './request'

export interface RecordItem {
    uid: string | null;
    resource_id: string | null;
    resource_name: string | null;
    quality_level: number | null;
    pool_type: string | null;
    time: string | null;
    in_second_seq: number | null;
    draw_order: number | null;
    is_up: number | null;
}

export interface RecordsResponse {
    code: number;
    message: string;
    data: RecordItem[];
}

export interface PoolAnalyzeItem {
    poolType: number;
    totalRecords: number;
    data: {
        total: number;
        fiveStar: number;
        avgPity: string;
        avgUp: string;
        upRate: string;
        pityList: Array<{
            count: number;
            name: string | null;
            isUp: boolean | null;
        }>;
        已垫: number;
        upSeries: number;
        notupSeries: number;
    };
}

export interface AnalyzeRecordsResponse {
    code: number;
    message: string;
    data: PoolAnalyzeItem[];
}

export function getRecordsData(): Promise<AxiosResponse<RecordsResponse>> {
    return request({
        url: '/api/readRecords',
        method: 'get'
    });
}

export function getAnalyzedRecordsData(): Promise<AxiosResponse<AnalyzeRecordsResponse>> {
    return request({
        url: '/api/analyzeRecords',
        method: 'get'
    });
}
