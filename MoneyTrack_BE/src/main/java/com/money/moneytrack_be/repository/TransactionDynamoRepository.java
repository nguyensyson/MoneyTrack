package com.money.moneytrack_be.repository;

import com.money.moneytrack_be.entity.TransactionItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class TransactionDynamoRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${dynamodb.table.transactions:moneytrack-transactions}")
    private String tableName;

    private DynamoDbTable<TransactionItem> table() {
        return enhancedClient.table(tableName, TableSchema.fromBean(TransactionItem.class));
    }

    public TransactionItem save(TransactionItem item) {
        table().putItem(item);
        return item;
    }

    public Optional<TransactionItem> findById(String transactionId) {
        TransactionItem item = table().getItem(Key.builder().partitionValue(transactionId).build());
        return Optional.ofNullable(item);
    }

    /**
     * Query transactions for a user within a date range using the GSI "userId-date-index".
     * DynamoDB sort key supports BETWEEN condition on ISO-8601 date strings (lexicographic order).
     *
     * @param userId    the user's UUID
     * @param startDate ISO-8601 date string (yyyy-MM-dd), inclusive
     * @param endDate   ISO-8601 date string (yyyy-MM-dd), inclusive
     * @return list of matching TransactionItems (all, including DELETED – filter in service layer)
     */
    public List<TransactionItem> findByUserIdAndDateRange(String userId, String startDate, String endDate) {
        DynamoDbIndex<TransactionItem> index = table().index("userId-date-index");

        QueryConditional condition = QueryConditional.sortBetween(
                Key.builder().partitionValue(userId).sortValue(startDate).build(),
                Key.builder().partitionValue(userId).sortValue(endDate).build()
        );

        return index.query(QueryEnhancedRequest.builder()
                        .queryConditional(condition)
                        .build())
                .stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());
    }

    /** Return all ACTIVE transactions (full scan – used for admin stats). */
    public List<TransactionItem> findAllActive() {
        return table().scan().stream()
                .flatMap(page -> page.items().stream())
                .filter(t -> t.getDeleteFlag() == 0)
                .collect(Collectors.toList());
    }

    /** Count all ACTIVE transactions (full scan – used for admin stats). */
    public long countActive() {
        return table().scan().stream()
                .flatMap(page -> page.items().stream())
                .filter(t -> t.getDeleteFlag() == 0)
                .count();
    }
}
