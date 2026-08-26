package com.sih.disaster.entity;

import com.sih.disaster.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Mapped to table "users" (USER is a reserved word in PostgreSQL / SQL).
 * password_hash is intentionally excluded from every response DTO - see
 * UserResponse - it must never be serialized back to any client (SRS 10.7).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
