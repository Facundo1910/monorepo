package com.fertilar.service.service.impl;

import com.fertilar.service.dto.LoginRequest;
import com.fertilar.service.dto.LoginResponse;
import com.fertilar.service.dto.RefreshRequest;
import com.fertilar.service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${aws.cognito.clientId}")
    private String clientId;

    @Override
    public LoginResponse login(LoginRequest request) {
        InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                .clientId(clientId)
                .authParameters(Map.of(
                        "USERNAME", request.getUsername(),
                        "PASSWORD", request.getPassword()
                ))
                .build();

        InitiateAuthResponse response = cognitoClient.initiateAuth(authRequest);
        AuthenticationResultType result = response.authenticationResult();

        return LoginResponse.builder()
                .accessToken(result.accessToken())
                .idToken(result.idToken())
                .refreshToken(result.refreshToken())
                .expiresIn(result.expiresIn())
                .tokenType(result.tokenType())
                .build();
    }

    @Override
    public void logout(String accessToken) {
        GlobalSignOutRequest signOutRequest = GlobalSignOutRequest.builder()
                .accessToken(accessToken)
                .build();

        cognitoClient.globalSignOut(signOutRequest);
    }

    @Override
    public LoginResponse refresh(RefreshRequest request) {
        InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                .clientId(clientId)
                .authParameters(Map.of(
                        "REFRESH_TOKEN", request.getRefreshToken()
                ))
                .build();

        InitiateAuthResponse response = cognitoClient.initiateAuth(authRequest);
        AuthenticationResultType result = response.authenticationResult();

        return LoginResponse.builder()
                .accessToken(result.accessToken())
                .idToken(result.idToken())
                .expiresIn(result.expiresIn())
                .tokenType(result.tokenType())
                .build();
    }
}
