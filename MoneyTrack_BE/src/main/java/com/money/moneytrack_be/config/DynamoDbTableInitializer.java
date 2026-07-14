package com.money.moneytrack_be.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.List;

/**
 * Creates DynamoDB tables on startup if they do not already exist.
 * This is the equivalent of Hibernate's ddl-auto=update for DynamoDB.
 *
 * Tables created:
 *   - moneytrack-users         (PK: userId, GSI: email-index)
 *   - moneytrack-categories    (PK: categoryId)
 *   - moneytrack-transactions  (PK: transactionId, GSI: userId-date-index)
 *
 * In production on AWS, tables are managed by Terraform (see /terraform).
 * This initializer is primarily for local development with DynamoDB Local.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DynamoDbTableInitializer implements ApplicationRunner {

    private final DynamoDbClient dynamoDbClient;

    @Value("${dynamodb.table.users:moneytrack-users}")
    private String usersTable;

    @Value("${dynamodb.table.categories:moneytrack-categories}")
    private String categoriesTable;

    @Value("${dynamodb.table.transactions:moneytrack-transactions}")
    private String transactionsTable;

    @Override
    public void run(ApplicationArguments args) {
        createUsersTable();
        createCategoriesTable();
        createTransactionsTable();
    }

    private void createUsersTable() {
        if (tableExists(usersTable)) {
            log.info("DynamoDB table '{}' already exists.", usersTable);
            return;
        }
        log.info("Creating DynamoDB table '{}'...", usersTable);
        dynamoDbClient.createTable(CreateTableRequest.builder()
                .tableName(usersTable)
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName("userId").attributeType(ScalarAttributeType.S).build(),
                        AttributeDefinition.builder().attributeName("email").attributeType(ScalarAttributeType.S).build()
                )
                .keySchema(
                        KeySchemaElement.builder().attributeName("userId").keyType(KeyType.HASH).build()
                )
                .globalSecondaryIndexes(
                        GlobalSecondaryIndex.builder()
                                .indexName("email-index")
                                .keySchema(KeySchemaElement.builder().attributeName("email").keyType(KeyType.HASH).build())
                                .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                                .build()
                )
                .build());
        waitForTable(usersTable);
    }

    private void createCategoriesTable() {
        if (tableExists(categoriesTable)) {
            log.info("DynamoDB table '{}' already exists.", categoriesTable);
            return;
        }
        log.info("Creating DynamoDB table '{}'...", categoriesTable);
        dynamoDbClient.createTable(CreateTableRequest.builder()
                .tableName(categoriesTable)
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName("categoryId").attributeType(ScalarAttributeType.S).build(),
                        AttributeDefinition.builder().attributeName("type").attributeType(ScalarAttributeType.S).build()
                )
                .keySchema(
                        KeySchemaElement.builder().attributeName("categoryId").keyType(KeyType.HASH).build()
                )
                .globalSecondaryIndexes(
                        GlobalSecondaryIndex.builder()
                                .indexName("type-index")
                                .keySchema(KeySchemaElement.builder().attributeName("type").keyType(KeyType.HASH).build())
                                .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                                .build()
                )
                .build());
        waitForTable(categoriesTable);
    }

    private void createTransactionsTable() {
        if (tableExists(transactionsTable)) {
            log.info("DynamoDB table '{}' already exists.", transactionsTable);
            return;
        }
        log.info("Creating DynamoDB table '{}'...", transactionsTable);
        dynamoDbClient.createTable(CreateTableRequest.builder()
                .tableName(transactionsTable)
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName("transactionId").attributeType(ScalarAttributeType.S).build(),
                        AttributeDefinition.builder().attributeName("userId").attributeType(ScalarAttributeType.S).build(),
                        AttributeDefinition.builder().attributeName("date").attributeType(ScalarAttributeType.S).build()
                )
                .keySchema(
                        KeySchemaElement.builder().attributeName("transactionId").keyType(KeyType.HASH).build()
                )
                .globalSecondaryIndexes(
                        GlobalSecondaryIndex.builder()
                                .indexName("userId-date-index")
                                .keySchema(
                                        KeySchemaElement.builder().attributeName("userId").keyType(KeyType.HASH).build(),
                                        KeySchemaElement.builder().attributeName("date").keyType(KeyType.RANGE).build()
                                )
                                .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                                .build()
                )
                .build());
        waitForTable(transactionsTable);
    }

    private boolean tableExists(String tableName) {
        try {
            dynamoDbClient.describeTable(DescribeTableRequest.builder().tableName(tableName).build());
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }

    private void waitForTable(String tableName) {
        log.info("Waiting for table '{}' to become ACTIVE...", tableName);
        dynamoDbClient.waiter().waitUntilTableExists(
                DescribeTableRequest.builder().tableName(tableName).build()
        );
        log.info("Table '{}' is ACTIVE.", tableName);
    }
}
