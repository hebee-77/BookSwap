package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.UserRequest;
import com.hebee.bookswap.dto.UserResponse;
import java.util.List;

public interface UserService {
    UserResponse createUser(UserRequest request);
    UserResponse getUserById(Long id);
    List<UserResponse> getAllUsers();
}
