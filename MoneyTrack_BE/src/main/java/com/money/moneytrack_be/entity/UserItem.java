package com.money.moneytrack_be.entity;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

import java.time.Instant;
import java.util.Set;

/**
 * DynamoDB item for the "moneytrack-users" table.
 *
 * Table schema:
 *   PK (partition key): userId  (UUID string)
 *   GSI "email-index":  email   (for login lookup)
 */
@DynamoDbBean
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserItem {

    private String userId;       // PK – UUID
    private String email;        // unique, used in GSI
    private String password;     // BCrypt hash
    private String name;
    private Set<String> roles;   // e.g. {"USER"} or {"ADMIN"}
    private String createdAt;    // ISO-8601
    private String updatedAt;    // ISO-8601

    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "email-index")
    @DynamoDbAttribute("email")
    public String getEmail() { return email; }
}
