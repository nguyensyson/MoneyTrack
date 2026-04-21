# Deployment Guide — MoneyTrack BE

End-to-end guide for building, pushing, and deploying the MoneyTrack backend to AWS ECS Fargate.

---

## Prerequisites

Make sure the following tools are installed and configured before you begin:

- **Docker** — [Install Docker](https://docs.docker.com/get-docker/)
- **AWS CLI v2** — [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html), then run `aws configure` with your credentials and default region
- **Terraform >= 1.0** — [Install Terraform](https://developer.hashicorp.com/terraform/install)

Verify everything is ready:

```bash
docker --version
aws --version
terraform --version
aws sts get-caller-identity   # confirms your AWS credentials are working
```

---

## Step 1 — Build the Docker Image Locally

From the project root, build the image using the multi-stage Dockerfile:

```bash
docker build -t moneytrack-be:latest .
```

To verify the image runs locally (optional):

```bash
docker run --rm -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/moneytrack \
  -e SPRING_DATASOURCE_USERNAME=admin \
  -e SPRING_DATASOURCE_PASSWORD=yourpassword \
  -e JWT_SECRET=yoursecret \
  moneytrack-be:latest
```

---

## Step 2 — Authenticate Docker to ECR and Push the Image

First, retrieve the ECR repository URL from Terraform outputs (after Step 3), or look it up in the AWS Console. It follows the pattern:

```
<account_id>.dkr.ecr.<region>.amazonaws.com/moneytrack-be
```

Set it as a variable for convenience:

```bash
ECR_URL=<account_id>.dkr.ecr.<region>.amazonaws.com/moneytrack-be
```

Authenticate Docker to ECR:

```bash
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin <account_id>.dkr.ecr.<region>.amazonaws.com
```

Tag and push the image:

```bash
docker tag moneytrack-be:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

> Note: The ECR repository must exist before pushing. It is created by Terraform in Step 3. If this is your first deployment, run `terraform apply` first (Step 3), then come back to push the image, then force a new ECS deployment (see Step 4).

---

## Step 3 — Provision Infrastructure with Terraform

Navigate to the `terraform/` directory:

```bash
cd terraform
```

Initialize Terraform (downloads providers):

```bash
terraform init
```

Review the execution plan. You will be prompted for sensitive variables (`db_password`, `jwt_secret`):

```bash
terraform plan \
  -var="db_password=yourdbpassword" \
  -var="jwt_secret=yourjwtsecret"
```

Apply the infrastructure:

```bash
terraform apply \
  -var="db_password=yourdbpassword" \
  -var="jwt_secret=yourjwtsecret"
```

Type `yes` when prompted to confirm. This will provision:
- VPC, subnets, Internet Gateway, route tables
- Security groups (ALB, ECS, RDS)
- ECR repository
- ECS cluster and Fargate task definition
- RDS MySQL 8.0 instance
- Application Load Balancer with HTTP listener

> Tip: To avoid typing sensitive vars each time, create a `terraform/terraform.tfvars` file (already in `.gitignore`):
> ```hcl
> db_password = "yourdbpassword"
> jwt_secret  = "yourjwtsecret"
> ```

---

## Step 4 — Retrieve the Public API URL

After `terraform apply` completes, retrieve the outputs:

```bash
terraform output alb_dns_name
terraform output ecr_repository_url
terraform output rds_endpoint
```

The `alb_dns_name` is your public API base URL:

```
http://<alb_dns_name>/
```

Test that the API is reachable:

```bash
curl http://$(terraform output -raw alb_dns_name)/
```

> Allow 1–2 minutes after apply for the ECS task to start and pass the ALB health check.

---

## Redeploying After Image Updates

When you push a new image to ECR, force ECS to pull it:

```bash
aws ecs update-service \
  --cluster moneytrack-cluster \
  --service moneytrack-be \
  --force-new-deployment \
  --region <region>
```

---

## Tearing Down

To destroy all provisioned AWS resources:

```bash
cd terraform
terraform destroy \
  -var="db_password=yourdbpassword" \
  -var="jwt_secret=yourjwtsecret"
```

> Warning: This will delete the RDS instance and all data. Set `skip_final_snapshot = false` in `main.tf` before destroying if you need a backup.
