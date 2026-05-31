package com.money.moneytrack_be.entity;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the "moneytrack-transactions" table.
 *
 * Table schema:
 *   PK (partition key): transactionId  (UUID string)
 *   GSI "userId-date-index":
 *       PK = userId, SK = date  (for per-user date-range queries)
 */
@DynamoDbBean
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionItem {

    private String transactionId;  // PK – UUID
    private String userId;         // GSI PK
    private String date;           // ISO-8601 date (yyyy-MM-dd), GSI SK
    private String amount;         // BigDecimal stored as String to preserve precision
    private String type;           // TransactionType enum name
    private String categoryId;
    private String categoryName;   // denormalized for read performance
    private String categoryType;   // denormalized
    private String parentCategoryId;   // denormalized
    private String parentCategoryName; // denormalized
    private String description;
    private int deleteFlag;        // 0 = ACTIVE, 1 = DELETED
    private String createdAt;      // ISO-8601
    private String updatedAt;      // ISO-8601

    @DynamoDbPartitionKey
    @DynamoDbAttribute("transactionId")
    public String getTransactionId() { return transactionId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "userId-date-index")
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }

    @DynamoDbSecondarySortKey(indexNames = "userId-date-index")
    @DynamoDbAttribute("date")
    public String getDate() { return date; }
}
