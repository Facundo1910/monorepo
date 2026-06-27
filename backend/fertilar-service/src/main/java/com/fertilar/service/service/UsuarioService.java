package com.fertilar.service.service;

import com.fertilar.service.dto.UsuarioCreateRequest;
import com.fertilar.service.dto.UsuarioDTO;
import com.fertilar.service.dto.UsuarioUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface UsuarioService {

    List<UsuarioDTO> listar(String authHeader);

    UsuarioDTO obtener(UUID id, String authHeader);

    UsuarioDTO crear(UsuarioCreateRequest request, String authHeader);

    UsuarioDTO actualizar(UUID id, UsuarioUpdateRequest request, String authHeader);
}
