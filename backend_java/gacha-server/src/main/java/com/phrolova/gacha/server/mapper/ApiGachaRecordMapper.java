package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.dto.RecordDetailDTO;
import com.phrolova.gacha.pojo.entity.ApiGachaRecord;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ApiGachaRecordMapper {

    Long countAll();

    ApiGachaRecord selectById(@Param("id") Long id);

    List<ApiGachaRecord> selectByAccountIdAndPoolType(@Param("accountId") Long accountId,
                                                      @Param("poolType") String poolType);

    List<RecordDetailDTO> selectAllDetails();

    RecordDetailDTO selectDetailById(@Param("id") Long id);
}
