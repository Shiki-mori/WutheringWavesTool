package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.AnalyzerRecordEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface AnalyzerRecordMapper {

    Long countAll();

    AnalyzerRecordEntity selectById(@Param("id") Long id);

    List<AnalyzerRecordEntity> selectByUidAndPoolType(@Param("uid") String uid,
                                                      @Param("poolType") Integer poolType);
}
