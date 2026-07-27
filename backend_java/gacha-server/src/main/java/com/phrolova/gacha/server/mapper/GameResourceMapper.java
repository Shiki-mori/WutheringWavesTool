package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.GameResource;
import org.apache.ibatis.annotations.Param;

public interface GameResourceMapper {

    GameResource selectByResourceId(@Param("resourceId") String resourceId);

    int insert(GameResource resource);
}
