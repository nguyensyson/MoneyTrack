# Deployment Guide — MoneyTrack BE

End-to-end guide for building, pushing, and deploying the MoneyTrack backend to AWS ECS Fargate with Amazon DynamoDB.

---

## Prerequisites

Make sure the following tools are installed and configured:

- **Docker** — [Install Docker](https://docs.docker.com/get-docker/)
- **AWS CLI v2** — [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html), then run `aws configure`
- **Terraform >= 1.5** — [Install Terraform](https://developer.hashicorp.com/terraform/install)

Verify everything is ready:

```bash
docker --version
aws --version
terraform --version
aws sts get-caller-identity   # confirms your AWS credentials are working
```

---

## Local Development with DynamoDB Local

To run the backend locally without connecting to AWS, use DynamoDB Local via Docker Compose:

```bash
# Start DynamoDB Local
docker compose up dynamodb-local -d

# Run the backend (in a separate terminal)
export AWS_REGION=ap-southeast-1
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export DYNAMODB_ENDPOINT=http://localhost:8000
export JWT_SECRET=local-dev-secret
./mvnw spring-boot:run
```

On startup, `DynamoDbTableInitializer` automatically creates the required tables if they don't exist.
`CategoryDataSeeder` seeds default categories on first run.

---

## Step 1 — Build the Docker Image

```bash
docker build -t moneytrack-be:latest .
```

Test locally against DynamoDB Local:

```bash
docker run --rm -p 8080:8080 \
  -e AWS_REGION=ap-southeast-1 \
  -e AWS_ACCESS_KEY_ID=local \
  -e AWS_SECRET_ACCESS_KEY=local \
  -e DYNAMODB_ENDPOINT=http://host.docker.internal:8000 \
  -e JWT_SECRET=local-dev-secret \
  moneytrack-be:latest
```

---

## Step 2 — Provision Infrastructure with Terraform

```bash
cd terraform
terraform init
```

Review the plan (only `jwt_secret` is required — no DB password needed):

```bash
terraform plan -var="jwt_secret=yourjwtsecret"
```

Apply:

```bash
terraform apply -var="jwt_secret=yourjwtsecret"
```

This provisions:
- VPC, subnets, Internet Gateway, route tables
- Security groups (ALB, ECS)
- ECR repository
- **3 DynamoDB tables** (users, categories, transactions) with GSIs
- **IAM task role** with DynamoDB read/write permissions (no hard-coded credentials)
- ECS cluster and Fargate task definition
- Application Load Balancer with HTTP listener

> Tip: Create `terraform/terraform.tfvars` (already in `.gitignore`) to avoid typing vars each time:
> ```hcl
> jwt_secret = "yourjwtsecret"
> ```

---

## Step 3 — Push the Docker Image to ECR

```bash
ECR_URL=$(terraform output -raw ecr_repository_url)

aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin $ECR_URL

docker tag moneytrack-be:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

---

## Step 4 — Retrieve the Public API URL

```bash
terraform output alb_dns_name
```

Test:

```bash
curl http://$(terraform output -raw alb_dns_name)/
```

> Allow 1–2 minutes for the ECS task to start and pass the ALB health check.

---

## Redeploying After Image Updates

```bash
aws ecs update-service \
  --cluster moneytrack-cluster \
  --service moneytrack-service \
  --force-new-deployment \
  --region ap-southeast-1
```

---

## Tearing Down

```bash
cd terraform
terraform destroy -var="jwt_secret=yourjwtsecret"
```

> **Warning:** This deletes the DynamoDB tables and all data. Export data first if needed.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8080` | Server port |
| `AWS_REGION` | Yes | `ap-southeast-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | Local only | — | AWS access key (use IAM role on AWS) |
| `AWS_SECRET_ACCESS_KEY` | Local only | — | AWS secret key (use IAM role on AWS) |
| `DYNAMODB_ENDPOINT` | Local only | — | Override endpoint (DynamoDB Local / LocalStack) |
| `DYNAMODB_TABLE_USERS` | No | `moneytrack-users` | Users table name |
| `DYNAMODB_TABLE_CATEGORIES` | No | `moneytrack-categories` | Categories table name |
| `DYNAMODB_TABLE_TRANSACTIONS` | No | `moneytrack-transactions` | Transactions table name |
| `JWT_SECRET` | Yes | — | JWT signing key |
| `JWT_EXPIRATION_MS` | No | `86400000` | JWT TTL in ms (24h) |

---

## Notes on Legacy MySQL Files

The following files are **no longer used at runtime** and are kept only for historical reference.
They can be safely deleted once the team confirms no rollback to MySQL is needed:

**Entities (JPA):**
- `entity/User.java`
- `entity/Transaction.java`
- `entity/Category.java`
- `entity/Role.java`
- `entity/BaseEntity.java`

**Repositories (Spring Data JPA):**
- `repository/UserRepository.java`
- `repository/TransactionRepository.java`
- `repository/CategoryRepository.java`
- `repository/RoleRepository.java`

**Config:**
- `config/AuditingConfig.java`

**Seed:**
- `seed/RoleDataSeeder.java`

**DTOs (JPA projections):**
- `dto/response/DailyExpenseProjection.java`
- `dto/response/MonthlyTransactionCountProjection.java`
