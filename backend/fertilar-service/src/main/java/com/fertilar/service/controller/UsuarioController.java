package com.fertilar.service.controller;

import com.fertilar.service.dto.UsuarioCreateRequest;
import com.fertilar.service.dto.UsuarioDTO;
import com.fertilar.service.dto.UsuarioUpdateRequest;
import com.fertilar.service.entity.Usuario;
import com.fertilar.service.repository.UsuarioRepository;
import com.fertilar.service.service.UsuarioAuthService;
import com.fertilar.service.service.UsuarioService;
import com.fertilar.service.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAuthService usuarioAuthService;
    private final UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> me(@RequestHeader("Authorization") String authHeader) {
        Usuario usuario = usuarioAuthService.obtenerUsuarioAutenticado(authHeader);
        return ResponseEntity.ok(UsuarioDTO.from(usuario));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(usuarioService.listar(authHeader));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> obtener(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(usuarioService.obtener(id, authHeader));
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> crear(
            @Valid @RequestBody UsuarioCreateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioService.crear(request, authHeader));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody UsuarioUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(usuarioService.actualizar(id, request, authHeader));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> sync(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "").trim();
        String payload = JwtUtil.decodePayload(token);

        String sub = JwtUtil.getClaim(payload, "sub");
        String email = JwtUtil.getClaim(payload, "email");
        String nombre = JwtUtil.getClaim(payload, "given_name");
        String apellido = JwtUtil.getClaim(payload, "family_name");
        String nombreLimpio = limpiarNombre(nombre, email);

        usuarioRepository.findByCognitoSub(sub).map(existing -> {
            boolean changed = false;
            if (nombreInvalido(existing.getNombre(), existing.getEmail())) {
                existing.setNombre(nombreLimpio);
                changed = true;
            } else if ((existing.getNombre() == null || existing.getNombre().isBlank())
                    && !nombreLimpio.isBlank()) {
                existing.setNombre(nombreLimpio);
                changed = true;
            }
            if ((existing.getApellido() == null || existing.getApellido().isBlank())
                    && apellido != null && !apellido.isBlank()) {
                existing.setApellido(apellido);
                changed = true;
            }
            return changed ? usuarioRepository.save(existing) : existing;
        }).orElseGet(() -> {
            Usuario nuevo = new Usuario();
            nuevo.setCognitoSub(sub);
            nuevo.setEmail(email != null ? email : sub);
            nuevo.setNombre(nombreLimpio);
            nuevo.setApellido(apellido != null ? apellido : "");
            nuevo.setRol(Usuario.Rol.OPERARIO);
            return usuarioRepository.save(nuevo);
        });

        return ResponseEntity.ok().build();
    }

    private static String limpiarNombre(String nombre, String email) {
        if (nombre == null || nombre.isBlank()) {
            return "";
        }
        String trimmed = nombre.trim();
        if (email != null && trimmed.equalsIgnoreCase(email.trim())) {
            return "";
        }
        if (trimmed.contains("@")) {
            return "";
        }
        return trimmed;
    }

    private static boolean nombreInvalido(String nombre, String email) {
        if (nombre == null || nombre.isBlank()) {
            return false;
        }
        if (email != null && nombre.trim().equalsIgnoreCase(email.trim())) {
            return true;
        }
        return nombre.contains("@");
    }
}
