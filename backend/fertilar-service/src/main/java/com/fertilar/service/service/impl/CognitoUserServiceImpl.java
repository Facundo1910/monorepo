package com.fertilar.service.service.impl;

import com.fertilar.service.service.CognitoUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminCreateUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDisableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminEnableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.DeliveryMediumType;

@Service
@RequiredArgsConstructor
public class CognitoUserServiceImpl implements CognitoUserService {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${aws.cognito.userPoolId}")
    private String userPoolId;

    @Override
    public String crearUsuario(String email, String nombre, String apellido, String contrasenaTemporal) {
        var requestBuilder = AdminCreateUserRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .userAttributes(
                        AttributeType.builder().name("email").value(email).build(),
                        AttributeType.builder().name("email_verified").value("true").build(),
                        AttributeType.builder().name("given_name").value(nombre).build(),
                        AttributeType.builder().name("family_name").value(apellido).build()
                )
                .desiredDeliveryMediums(DeliveryMediumType.EMAIL);

        if (contrasenaTemporal != null && !contrasenaTemporal.isBlank()) {
            requestBuilder.temporaryPassword(contrasenaTemporal);
        }

        return cognitoClient.adminCreateUser(requestBuilder.build())
                .user()
                .attributes()
                .stream()
                .filter(attr -> "sub".equals(attr.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Cognito no devolvió el identificador del usuario"));
    }

    @Override
    public void desactivarUsuario(String email) {
        cognitoClient.adminDisableUser(AdminDisableUserRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .build());
    }

    @Override
    public void activarUsuario(String email) {
        cognitoClient.adminEnableUser(AdminEnableUserRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .build());
    }
}
