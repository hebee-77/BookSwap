package com.hebee.bookswap.config;

import com.hebee.bookswap.entity.Role;
import com.hebee.bookswap.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeRole("USER");
        initializeRole("ADMIN");
    }

    private void initializeRole(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            Role role = new Role(roleName);
            roleRepository.save(role);
        }
    }
}
