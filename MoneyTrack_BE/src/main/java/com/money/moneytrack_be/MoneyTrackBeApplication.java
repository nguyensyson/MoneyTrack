package com.money.moneytrack_be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class MoneyTrackBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoneyTrackBeApplication.class, args);
    }

}
