package com.money.moneytrack_be.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClientBuilder;

import java.net.URI;

/**
 * DynamoDB client configuration.
 *
 * Credentials are resolved automatically via the AWS Default Credentials Provider Chain:
 *   1. Environment variables: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *   2. ~/.aws/credentials file (local dev)
 *   3. ECS task role / EC2 instance profile (production on AWS)
 *
 * Never hard-code credentials in this class.
 */
@Configuration
public class DynamoDbConfig {

    @Value("${aws.region:ap-southeast-1}")
    private String awsRegion;

    /**
     * Optional: override endpoint for local DynamoDB (DynamoDB Local / LocalStack).
     * Leave empty in production.
     */
    @Value("${aws.dynamodb.endpoint:}")
    private String dynamoDbEndpoint;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        DynamoDbClientBuilder builder = DynamoDbClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create());

        // Allow local override for development / testing
        if (dynamoDbEndpoint != null && !dynamoDbEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(dynamoDbEndpoint));
        }

        return builder.build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }
}
