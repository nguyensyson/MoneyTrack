package com.money.moneytrack_be.repository;

import com.money.moneytrack_be.entity.CategoryItem;
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
public class CategoryDynamoRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${dynamodb.table.categories:moneytrack-categories}")
    private String tableName;

    private DynamoDbTable<CategoryItem> table() {
        return enhancedClient.table(tableName, TableSchema.fromBean(CategoryItem.class));
    }

    public CategoryItem save(CategoryItem item) {
        table().putItem(item);
        return item;
    }

    public Optional<CategoryItem> findById(String categoryId) {
        CategoryItem item = table().getItem(Key.builder().partitionValue(categoryId).build());
        return Optional.ofNullable(item);
    }

    /** Scan all items (categories table is small, full scan is acceptable). */
    public List<CategoryItem> findAll() {
        return table().scan().stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());
    }

    /** Find all ACTIVE categories (deleteFlag == 0). */
    public List<CategoryItem> findAllActive() {
        return findAll().stream()
                .filter(c -> c.getDeleteFlag() == 0)
                .collect(Collectors.toList());
    }

    /** Find all ACTIVE categories of a given type. */
    public List<CategoryItem> findActiveByType(String type) {
        return findAllActive().stream()
                .filter(c -> type.equals(c.getType()))
                .collect(Collectors.toList());
    }

    /** Count ACTIVE categories. */
    public long countActive() {
        return findAllActive().size();
    }

    public long count() {
        return findAll().size();
    }
}
