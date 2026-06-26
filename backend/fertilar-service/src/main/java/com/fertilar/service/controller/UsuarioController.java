package com.fertilar.service.controller;

import com.fertilar.service.dto.UsuarioDTO;
import com.fertilar.service.entity.Usuario;
import com.fertilar.service.repository.UsuarioRepository;
import com.fertilar.service.service.UsuarioAuthService;
import com.fertilar.service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAuthService usuarioAuthService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> me(@RequestHeader("Authorization") String authHeader) {
        Usuario usuario = usuarioAuthService.obtenerUsuarioAutenticado(authHeader);
        return ResponseEntity.ok(UsuarioDTO.from(usuario));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> sync(@RequestHeader("Authorization") String authHeader) {
        String payload = JwtUtil.decodePayload(authHeader.replace("Bearer ", ""));

        String sub      = JwtUtil.getClaim(payload, "sub");
        String email    = JwtUtil.getClaim(payload, "email");
        String nombre   = JwtUtil.getClaim(payload, "given_name");
        String apellido = JwtUtil.getClaim(payload, "family_name");

        usuarioRepository.findByCognitoSub(sub).orElseGet(() -> {
            Usuario nuevo = new Usuario();
            nuevo.setCognitoSub(sub);
            nuevo.setEmail(email != null ? email : sub);
            nuevo.setNombre(nombre != null ? nombre : "");
            nuevo.setApellido(apellido != null ? apellido : "");
            nuevo.setRol(Usuario.Rol.OPERARIO);
            return usuarioRepository.save(nuevo);
        });

        return ResponseEntity.ok().build();
    }
}
