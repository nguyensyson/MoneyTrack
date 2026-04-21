# Requirements Document

## Introduction

This spec covers the containerization and AWS cloud deployment of the MoneyTrack_BE Spring Boot application. The goal is to produce a production-ready Docker setup for local development and a Terraform-based AWS ECS (Fargate) deployment with RDS MySQL, exposed publicly via an Application Load Balancer.

## Requirements

### Requirement 1 - Dockerize the Backend Application

**User Story:** As a DevOps engineer, I want a production-ready Dockerfile for the Spring Boot app, so that the application can be built and run consistently in any environment.

#### Acceptance Criteria

1. WHEN the Dockerfile is built THEN it SHALL use a multi-stage build (Maven build stage + lightweight runtime stage).
2. WHEN building the JAR THEN the build stage SHALL use Maven with Java 17 to compile and package the application.
3. WHEN running the container THEN the runtime stage SHALL use a lightweight base image (eclipse-temurin:17-jre-alpine or equivalent).
4. WHEN the container starts THEN it SHALL expose port 8080.
5. WHEN the container is configured THEN it SHALL support environment variables for SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, and SERVER_PORT.
6. WHEN the image is built THEN it SHALL be optimized for minimal image size by excluding unnecessary build artifacts.

---

### Requirement 2 - Docker Compose for Local Development

**User Story:** As a developer, I want a docker-compose.yml that runs the backend and MySQL together locally, so that I can develop and test without a cloud environment.

#### Acceptance Criteria

1. WHEN docker-compose up is run THEN it SHALL start both a `backend` service and a `mysql` service.
2. WHEN the backend service starts THEN it SHALL map host port 8080 to container port 8080.
3. WHEN the backend service starts THEN it SHALL depend on the mysql service being healthy before starting.
4. WHEN the backend connects to MySQL THEN it SHALL use the MySQL service name as the hostname in the datasource URL.
5. WHEN the mysql service starts THEN it SHALL use the official mysql:8 image with root password, database name, and a named volume for data persistence.
6. WHEN the mysql service is running THEN it SHALL have a healthcheck configured to verify readiness.
7. WHEN environment variables are needed THEN the compose file SHALL support loading them from a `.env` file.
8. WHEN a `.env.example` file is provided THEN it SHALL document all required environment variables with placeholder values.

---

### Requirement 3 - Terraform AWS Infrastructure

**User Story:** As a DevOps engineer, I want Terraform code to provision all required AWS infrastructure, so that the backend can be deployed to ECS Fargate with a single apply.

#### Acceptance Criteria

1. WHEN Terraform is applied THEN it SHALL create a VPC with at least two public subnets across different availability zones.
2. WHEN the VPC is created THEN it SHALL have an Internet Gateway and route tables configured for public internet access.
3. WHEN Terraform is applied THEN it SHALL create an ECS cluster for running Fargate tasks.
4. WHEN Terraform is applied THEN it SHALL create an ECR repository to store the backend Docker image.
5. WHEN the ECS task definition is created THEN it SHALL use Fargate launch type with configurable CPU and memory.
6. WHEN the task definition is created THEN it SHALL map container port 8080 and pass DB environment variables from variables or Secrets Manager references.
7. WHEN the ECS service is created THEN it SHALL run on Fargate in public subnets with a public IP assigned.
8. WHEN the ECS service is created THEN it SHALL be associated with an Application Load Balancer target group.

---

### Requirement 4 - Application Load Balancer

**User Story:** As a DevOps engineer, I want an ALB in front of the ECS service, so that the API is publicly accessible via a stable DNS endpoint on port 80.

#### Acceptance Criteria

1. WHEN Terraform is applied THEN it SHALL create an Application Load Balancer in the public subnets.
2. WHEN the ALB is created THEN it SHALL have an HTTP listener on port 80.
3. WHEN a request hits the ALB on port 80 THEN it SHALL forward traffic to the ECS service on port 8080.
4. WHEN the ALB is created THEN it SHALL have a security group allowing inbound HTTP (port 80) from anywhere (0.0.0.0/0).
5. WHEN the ECS task security group is created THEN it SHALL allow inbound traffic on port 8080 only from the ALB security group.

---

### Requirement 5 - RDS MySQL Database

**User Story:** As a DevOps engineer, I want an RDS MySQL instance provisioned by Terraform, so that the backend has a managed, persistent database in AWS.

#### Acceptance Criteria

1. WHEN Terraform is applied THEN it SHALL create an RDS MySQL 8.0 instance.
2. WHEN the RDS instance is created THEN it SHALL be placed in private subnets (or public subnets with restricted access) and not directly exposed to the internet.
3. WHEN the RDS security group is configured THEN it SHALL allow inbound MySQL traffic (port 3306) only from the ECS task security group.
4. WHEN the RDS instance is created THEN it SHALL use configurable variables for db_name, db_username, and db_password (no hardcoded secrets).
5. WHEN the RDS instance is created THEN it SHALL have a configurable instance class (default db.t3.micro for cost efficiency).

---

### Requirement 6 - Terraform Outputs

**User Story:** As a DevOps engineer, I want Terraform to output key resource identifiers after apply, so that I can quickly find the public API URL and ECR repository.

#### Acceptance Criteria

1. WHEN Terraform apply completes THEN it SHALL output the ALB DNS name as the public API URL.
2. WHEN Terraform apply completes THEN it SHALL output the ECR repository URL for use in image push commands.
3. WHEN Terraform apply completes THEN it SHALL output the RDS endpoint for reference.

---

### Requirement 7 - Terraform Code Quality and Structure

**User Story:** As a DevOps engineer, I want the Terraform code to follow best practices, so that it is maintainable, secure, and easy to extend.

#### Acceptance Criteria

1. WHEN Terraform files are created THEN they SHALL be split into provider.tf, main.tf, variables.tf, and outputs.tf.
2. WHEN values are used in Terraform THEN they SHALL be defined as variables with descriptions and defaults where appropriate — no hardcoded values.
3. WHEN sensitive values (passwords) are used THEN they SHALL be declared as sensitive variables and never logged in outputs.
4. WHEN Terraform code is written THEN it SHALL include inline comments explaining key resources and decisions.

---

### Requirement 8 - Deployment Guide

**User Story:** As a DevOps engineer, I want a step-by-step deployment guide, so that I can build, push, and deploy the application end-to-end without guesswork.

#### Acceptance Criteria

1. WHEN the deployment guide is written THEN it SHALL include steps to build the Docker image locally.
2. WHEN the deployment guide is written THEN it SHALL include steps to authenticate with ECR and push the image.
3. WHEN the deployment guide is written THEN it SHALL include steps to initialize and apply Terraform.
4. WHEN the deployment guide is written THEN it SHALL include how to retrieve the public API URL from Terraform outputs.
5. WHEN the deployment guide is written THEN it SHALL be placed in a DEPLOYMENT.md file at the project root.
