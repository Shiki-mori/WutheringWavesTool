package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.AnalyzerRecordEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
// 将接口标记为数据库mapper
// 指示 mybatis 扫描该接口，运行时自动创建其实现类
// 从而将接口方法与sql语句关联起来
public interface AnalyzerRecordMapper {

    Long countAll();

    AnalyzerRecordEntity selectById(@Param("id") Long id);

    List<AnalyzerRecordEntity> selectByUidAndPoolType(@Param("uid") String uid,
                                                      @Param("poolType") Integer poolType);
}
