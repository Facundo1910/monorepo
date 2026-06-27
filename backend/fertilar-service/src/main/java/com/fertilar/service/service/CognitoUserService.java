package com.fertilar.service.service;

public interface CognitoUserService {

    String crearUsuario(String email, String nombre, String apellido, String contrasenaTemporal);

    void desactivarUsuario(String email);

    void activarUsuario(String email);
}
