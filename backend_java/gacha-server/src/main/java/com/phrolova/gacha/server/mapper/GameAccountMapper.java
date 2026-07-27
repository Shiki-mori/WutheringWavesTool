package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.GameAccount;
import org.apache.ibatis.annotations.Param;

public interface GameAccountMapper {

    GameAccount selectByServerAndGameUid(@Param("serverId") String serverId,
                                         @Param("gameUid") String gameUid);

    int insert(GameAccount account);
}
