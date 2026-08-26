package com.sih.disaster.dto.response;

import com.sih.disaster.entity.AppUser;
import com.sih.disaster.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * NEVER includes passwordHash - see AppUser javadoc / SRS 10.7.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private UserRole role;

    public static UserResponse from(AppUser u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .build();
    }
}
