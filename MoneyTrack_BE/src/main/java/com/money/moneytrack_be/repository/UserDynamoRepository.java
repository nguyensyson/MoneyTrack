package com.money.moneytrack_be.repository;

import com.money.moneytrack_be.entity.UserItem;
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
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserDynamoRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${dynamodb.table.users:moneytrack-users}")
    private String tableName;

    private DynamoDbTable<UserItem> table() {
        return enhancedClient.table(tableName, TableSchema.fromBean(UserItem.class));
    }

    public UserItem save(UserItem item) {
        table().putItem(item);
        return item;
    }

    public Optional<UserItem> findById(String userId) {
        UserItem item = table().getItem(Key.builder().partitionValue(userId).build());
        return Optional.ofNullable(item);
    }

    public Optional<UserItem> findByEmail(String email) {
        DynamoDbIndex<UserItem> index = table().index("email-index");
        QueryConditional condition = QueryConditional.keyEqualTo(
                Key.builder().partitionValue(email).build());
        return index.query(QueryEnhancedRequest.builder()
                        .queryConditional(condition)
                        .limit(1)
                        .build())
                .stream()
                .flatMap(page -> page.items().stream())
                .findFirst();
    }

    public long count() {
        // Scan with select COUNT for efficiency
        return table().scan(ScanEnhancedRequest.builder().build())
                .stream()
                .mapToLong(page -> page.items().size())
                .sum();
    }

    public List<UserItem> findAll() {
        return table().scan().stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());
    }
}
