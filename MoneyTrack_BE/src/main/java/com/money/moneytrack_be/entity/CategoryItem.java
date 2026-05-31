package com.money.moneytrack_be.entity;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the "moneytrack-categories" table.
 *
 * Table schema:
 *   PK (partition key): categoryId  (UUID string)
 *   GSI "type-index":   type        (INCOME | EXPENSE | DEBT)
 */
@DynamoDbBean
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryItem {

    private String categoryId;   // PK – UUID
    private String name;
    private String type;         // CategoryType enum name
    private String parentId;     // null for root categories
    private int deleteFlag;      // 0 = ACTIVE, 1 = DELETED
    private String createdAt;    // ISO-8601
    private String updatedAt;    // ISO-8601

    @DynamoDbPartitionKey
    @DynamoDbAttribute("categoryId")
    public String getCategoryId() { return categoryId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "type-index")
    @DynamoDbAttribute("type")
    public String getType() { return type; }
}
