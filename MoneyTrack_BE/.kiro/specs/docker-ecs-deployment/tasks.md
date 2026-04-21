# Implementation Plan

- [x] 1. Create the Dockerfile





  - Write a multi-stage Dockerfile: stage 1 uses `maven:3.9-eclipse-temurin-17` to run `mvn clean package -DskipTests`, stage 2 uses `eclipse-temurin:17-jre-alpine` and copies the built JAR
  - Expose port 8080 and set `ENTRYPOINT ["java", "-jar", "app.jar"]`
  - Declare `ENV` placeholders for `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SERVER_PORT`, `JWT_SECRET`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Create Docker Compose and environment files





- [x] 2.1 Write `.env.example`


  - Document all required environment variables with placeholder values: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`
  - _Requirements: 2.7, 2.8_


- [x] 2.2 Write `docker-compose.yml`

  - Define `mysql` service using `mysql:8`, named volume `mysql_data`, healthcheck using `mysqladmin ping -h localhost`
  - Define `backend` service built from Dockerfile, port `8080:8080`, `depends_on` mysql with `condition: service_healthy`, env vars referencing `.env` variables
  - Set `SPRING_DATASOURCE_URL` to use the `mysql` service hostname
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Create Terraform provider and variables files





- [x] 3.1 Write `terraform/provider.tf`


  - Configure the `aws` provider with `region` variable
  - Add Terraform version constraints
  - _Requirements: 7.1, 7.4_

- [x] 3.2 Write `terraform/variables.tf`


  - Define variables: `aws_region`, `app_name`, `db_name`, `db_username`, `db_password` (sensitive), `jwt_secret` (sensitive), `ecs_cpu`, `ecs_memory`, `ecs_desired_count`, `db_instance_class`
  - Include descriptions and sensible defaults for non-sensitive variables
  - _Requirements: 7.2, 7.3_

- [x] 4. Write `terraform/main.tf` — Networking





  - Create VPC (`10.0.0.0/16`), 2 public subnets and 2 private subnets across 2 AZs
  - Create Internet Gateway and attach to VPC
  - Create public route table with `0.0.0.0/0 → IGW` and associate with public subnets
  - _Requirements: 3.1, 3.2_

- [x] 5. Write `terraform/main.tf` — Security Groups





  - Create `alb-sg`: inbound TCP 80 from `0.0.0.0/0`
  - Create `ecs-sg`: inbound TCP 8080 from `alb-sg` only
  - Create `rds-sg`: inbound TCP 3306 from `ecs-sg` only
  - _Requirements: 4.4, 4.5, 5.3_

- [x] 6. Write `terraform/main.tf` — ECR and ECS Cluster





  - Create ECR repository named `moneytrack-be` with image scan on push enabled
  - Create ECS cluster named `moneytrack-cluster`
  - _Requirements: 3.3, 3.4_


- [x] 7. Write `terraform/main.tf` — IAM and ECS Task Definition




  - Create IAM role `ecsTaskExecutionRole` with `sts:AssumeRole` for `ecs-tasks.amazonaws.com` and attach `AmazonECSTaskExecutionRolePolicy`
  - Create ECS task definition (Fargate, `awsvpc` network mode) with container port 8080, CPU/memory from variables, and env vars: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`
  - _Requirements: 3.5, 3.6_

- [x] 8. Write `terraform/main.tf` — RDS MySQL





  - Create DB subnet group using private subnets
  - Create RDS MySQL 8.0 instance using `db_instance_class` variable, `db_name`, `db_username`, `db_password` variables, `publicly_accessible = false`, `skip_final_snapshot = true`
  - Attach `rds-sg` security group
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Write `terraform/main.tf` — ALB and ECS Service





  - Create ALB (internet-facing) in public subnets with `alb-sg`
  - Create target group on port 8080 with health check path `/`
  - Create HTTP listener on port 80 forwarding to target group
  - Create ECS service (Fargate) in public subnets with `assign_public_ip = true`, desired count from variable, linked to ALB target group
  - _Requirements: 3.7, 3.8, 4.1, 4.2, 4.3_

- [x] 10. Write `terraform/outputs.tf`





  - Output `alb_dns_name` (the public API URL)
  - Output `ecr_repository_url`
  - Output `rds_endpoint`
  - Mark no outputs as sensitive (endpoints are not secrets)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Write `DEPLOYMENT.md`





  - Document prerequisites: AWS CLI configured, Terraform installed, Docker installed
  - Step 1: Build Docker image locally
  - Step 2: Authenticate Docker to ECR (`aws ecr get-login-password`) and push image
  - Step 3: `terraform init`, `terraform plan`, `terraform apply` inside `terraform/`
  - Step 4: Retrieve public URL from `terraform output alb_dns_name`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
