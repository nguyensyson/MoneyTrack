package com.money.moneytrack_be.seed;

import com.money.moneytrack_be.entity.Role;
import com.money.moneytrack_be.enums.RoleName;
import com.money.moneytrack_be.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleDataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (roleRepository.count() > 0) {
            return;
        }

        seedRoles();
    }

    private void seedRoles() {
        saveRoles(List.of(RoleName.USER, RoleName.ADMIN));
    }

    private void saveRoles(List<RoleName> roleNames) {
        roleNames.forEach(role ->
                roleRepository.save(
                        Role.builder()
                                .name(role)
                                .build()
                )
        );
    }
}