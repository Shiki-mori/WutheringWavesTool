package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.GachaPool;
import org.apache.ibatis.annotations.Param;

public interface GachaPoolMapper {

    GachaPool selectByPoolType(@Param("poolType") String poolType);

    int insert(GachaPool pool);
}
