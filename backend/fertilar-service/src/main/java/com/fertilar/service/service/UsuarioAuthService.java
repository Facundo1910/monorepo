package com.fertilar.service.service;

import com.fertilar.service.entity.Usuario;

public interface UsuarioAuthService {

    Usuario obtenerUsuarioAutenticado(String authHeader);

    Usuario requireRol(String authHeader, Usuario.Rol... roles);
}
