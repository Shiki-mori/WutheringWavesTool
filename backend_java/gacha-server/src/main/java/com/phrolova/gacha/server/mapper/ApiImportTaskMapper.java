package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.ApiImportTask;
import org.apache.ibatis.annotations.Param;

public interface ApiImportTaskMapper {

    int insert(ApiImportTask task);

    int updateImportedCount(@Param("id") Long id, @Param("importedCount") Integer importedCount);
}
