package com.phrolova.gacha.server.mapper;

import com.phrolova.gacha.pojo.entity.User;
import org.apache.ibatis.annotations.Param;

public interface UserMapper {

    User selectById(@Param("id") Long id);

    int insertIgnore(User user);
}
