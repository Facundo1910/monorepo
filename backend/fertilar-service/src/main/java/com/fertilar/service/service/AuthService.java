package com.fertilar.service.service;

import com.fertilar.service.dto.LoginRequest;
import com.fertilar.service.dto.LoginResponse;
import com.fertilar.service.dto.RefreshRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void logout(String accessToken);

    LoginResponse refresh(RefreshRequest request);
}
