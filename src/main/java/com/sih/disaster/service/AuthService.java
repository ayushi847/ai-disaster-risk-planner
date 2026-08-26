package com.sih.disaster.service;

import com.sih.disaster.dto.request.LoginRequest;
import com.sih.disaster.dto.request.RegisterRequest;
import com.sih.disaster.dto.response.AuthResponse;
import com.sih.disaster.dto.response.UserResponse;
import com.sih.disaster.entity.AppUser;
import com.sih.disaster.exception.ConflictException;
import com.sih.disaster.repository.UserRepository;
import com.sih.disaster.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Owner: Purwansh (SRS 5.1). Issues JWTs consumed by every other module's write endpoints. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        AppUser user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalStateException("User vanished after authentication"));

        UserDetails userDetails = User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.from(user))
                .build();
    }

    /** Admin-only account creation (SRS 5.1: POST /api/auth/register requires Admin auth). */
    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("An account with this email already exists");
        }
        AppUser user = AppUser.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse me(String email) {
        return userRepository.findByEmail(email)
                .map(UserResponse::from)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }
}
