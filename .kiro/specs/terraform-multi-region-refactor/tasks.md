# Implementation Plan: Terraform Multi-Region Refactor

## Overview

Refactor the existing flat Terraform layout into a three-layer hierarchy: bootstrap layer (S3 + DynamoDB backend), reusable modules derived strictly from existing source files, and environment-region root modules for dev/prod × ap-southeast-1/ap-northeast-1. All existing infrastructure behavior is preserved.

## Tasks

- [x] 1. Create bootstrap layer at terraform/bootstrap/
  - Create terraform/bootstrap/main.tf with terraform block (required_version >=1.5.0, aws ~>5.0, backend "local" {}), provider aws (region=var.aws_region), aws_s3_bucket "state" (versioning enabled, AES256 SSE, all public-access blocks true), aws_s3_bucket_versioning, aws_s3_bucket_server_side_encryption_configuration, aws_s3_bucket_public_access_block, aws_dynamodb_table "lock" (LockID S hash key, PAY_PER_REQUEST)
  - Create terraform/bootstrap/variables.tf with four variables: project_name (default "moneytrack"), aws_region (default "ap-southeast-1"), state_bucket_name (default "moneytrack-terraform-state"), lock_table_name (default "moneytrack-terraform-locks")
  - Create terraform/bootstrap/outputs.tf with three outputs: state_bucket_name, state_bucket_arn, lock_table_name
  - Create terraform/bootstrap/terraform.tfvars with concrete values matching variable defaults
  - **Requirements**: 1

- [ ] 2. Create network module at terraform/modules/network/
  - Create terraform/modules/network/main.tf with all resources from network.tf PLUS the three security groups from security.tf (to break the circular dependency): data "aws_availability_zones", aws_vpc, aws_subnet public/private (count), aws_internet_gateway, aws_eip nat (count, domain=vpc), aws_nat_gateway (count), aws_route_table public (IGW) + private (count, NAT GW per AZ), aws_route_table_association public/private, aws_vpc_endpoint dynamodb+s3 (Gateway, route_table_ids=private[*].id), aws_vpc_endpoint ecr_api/ecr_dkr/logs/secretsmanager/ssm (Interface, subnet_ids=private[*].id, security_group_ids=[vpc_endpoint.id], private_dns_enabled=true). Use var.primary_region in all service_name strings. aws_security_group "alb" (HTTP 80 + HTTPS 443 from 0.0.0.0/0), aws_security_group "ecs" (container_port from alb SG), aws_security_group "vpc_endpoint" (HTTPS 443 from vpc_cidr)
  - Create terraform/modules/network/variables.tf: project_name, environment, primary_region, vpc_cidr, public_subnet_cidrs (list(string)), private_subnet_cidrs (list(string)), container_port (number)
  - Create terraform/modules/network/outputs.tf: vpc_id, public_subnet_ids, private_subnet_ids, nat_gateway_public_ips, private_route_table_ids, vpc_endpoint_sg_id, alb_sg_id, ecs_sg_id
  - **Requirements**: 2, 3, 16, 18

- [ ] 3. Create security module at terraform/modules/security/
  - Create terraform/modules/security/main.tf with WAF-only resources (security groups moved to network module): aws_wafv2_web_acl "main" (scope=REGIONAL, default_action allow, Rule 1 RateLimitRule p1 block rate_based_statement limit=var.waf_rate_limit IP, Rule 2 AWSManagedRulesCommonRuleSet p2 override_action none, Rule 3 AWSManagedRulesKnownBadInputsRuleSet p3 override_action none — preserve all rule names/priorities/vendor names exactly); aws_wafv2_web_acl_association "alb" (resource_arn=var.alb_arn)
  - Create terraform/modules/security/variables.tf: project_name, environment, alb_arn, waf_rate_limit (number)
  - Create terraform/modules/security/outputs.tf: waf_web_acl_arn
  - **Requirements**: 2, 4, 16

- [ ] 4. Create compute module at terraform/modules/compute/
  - Create terraform/modules/compute/main.tf with all 14 resources from compute.tf replacing cross-file references with input variables: aws_ecr_repository backend (scan_on_push=true, AES256), aws_ecr_lifecycle_policy backend (untagged expire 1 day p1, tagged keep last 10 tagPrefixList ["v","latest"] p2), aws_ecs_cluster main (containerInsights enabled), aws_ecs_cluster_capacity_providers (FARGATE+FARGATE_SPOT base=1 weight=1), aws_cloudwatch_log_group ecs (retention=var.log_retention_days), aws_ecs_task_definition backend (FARGATE awsvpc, execution_role=var.ecs_task_execution_role_arn, task_role=var.ecs_task_role_arn, container with PORT/AWS_REGION/DYNAMODB_TABLE_* env vars, JWT_SECRET secret from var.jwt_secret_arn, awslogs driver, healthCheck curl /actuator/health), aws_lb main (ALB, alb_sg_id, public_subnet_ids, enable_deletion_protection=var.environment=="prod"?true:false, access_logs bucket=var.alb_logs_bucket_id), aws_lb_target_group backend (ip type, /actuator/health matcher=200, deregistration_delay=30), aws_lb_listener http (80 redirect 443 HTTP_301), aws_lb_listener https (443 TLS13-1-2-2021-06, certificate_arn=var.certificate_arn), aws_ecs_service backend (enable_execute_command=true, circuit_breaker+rollback, depends_on=[aws_lb_listener.https], lifecycle ignore_changes=[desired_count]), aws_appautoscaling_target, aws_appautoscaling_policy ecs_cpu (CPU 70% target scale_in=300 scale_out=60), aws_appautoscaling_policy ecs_memory (Memory 80%)
  - Create terraform/modules/compute/variables.tf with all 25 inputs: project_name, environment, primary_region, ecr_image_tag_mutability, ecs_cpu, ecs_memory, ecs_desired_count, ecs_min_capacity, ecs_max_capacity, container_port, backend_image_tag, log_retention_days, dynamodb_table_users, dynamodb_table_categories, dynamodb_table_transactions, vpc_id, public_subnet_ids (list), private_subnet_ids (list), alb_sg_id, ecs_sg_id, ecs_task_execution_role_arn, ecs_task_role_arn, certificate_arn, jwt_secret_arn, alb_logs_bucket_id
  - Create terraform/modules/compute/outputs.tf: alb_dns_name, alb_arn, alb_arn_suffix, ecs_cluster_name, ecs_service_name, ecr_repository_url, ecr_repository_arn, ecs_task_execution_role_arn (passthrough var), ecs_task_role_arn (passthrough var)
  - **Requirements**: 2, 5, 16

- [ ] 5. Create database module at terraform/modules/database/
  - Create terraform/modules/database/main.tf with all three aws_dynamodb_table resources exactly as in database.tf: users (hash_key=userId S, GSI email-index hash=email S), categories (hash_key=categoryId S, GSI type-index hash=type S), transactions (hash_key=transactionId S, GSI userId-date-index hash=userId S range=date S). All three: billing_mode=PAY_PER_REQUEST, stream_enabled=var.dynamodb_enable_global_tables, stream_view_type=conditional, point_in_time_recovery enabled=var.dynamodb_point_in_time_recovery, server_side_encryption enabled=true, dynamic "replica" block (for_each: enable_global_tables?[secondary_region]:[]), lifecycle { prevent_destroy = true }
  - Create terraform/modules/database/variables.tf: project_name, environment, secondary_region, dynamodb_enable_global_tables (bool), dynamodb_point_in_time_recovery (bool), dynamodb_table_users, dynamodb_table_categories, dynamodb_table_transactions
  - Create terraform/modules/database/outputs.tf: users_table_name, users_table_arn, categories_table_name, categories_table_arn, transactions_table_name, transactions_table_arn
  - **Requirements**: 2, 6, 16

- [ ] 6. Create IAM module at terraform/modules/iam/
  - Create terraform/modules/iam/main.tf with all resources from iam.tf: data aws_iam_policy_document ecs_assume_role, aws_iam_role ecs_task_execution, aws_iam_role_policy_attachment ecs_execution_managed (AmazonECSTaskExecutionRolePolicy), aws_iam_role_policy ecs_execution_secrets (GetSecretValue+DescribeSecret on [var.jwt_secret_arn]), aws_iam_role ecs_task, aws_iam_role_policy ecs_task_dynamodb (full DynamoDB actions on all var.dynamodb_table_arns and their /index/*), aws_iam_role_policy ecs_task_secrets, aws_iam_role_policy ecs_task_ssm (SSM path arn:aws:ssm:${var.primary_region}:*:parameter/${var.project_name}/${var.environment}/* + SSMSessionManager), aws_iam_role_policy ecs_task_cloudwatch, data/resource aws_iam_openid_connect_provider github (count conditional on create_github_oidc_provider, thumbprint 6938fd4d98bab03faadb97b34396831e3780aea1), locals github_oidc_provider_arn, aws_iam_role github_actions (StringLike sub=repo:${github_org}/${github_repo}:*), aws_iam_role_policy github_actions_ecr (ECRAuth+ECRPush on ecr_repository_arn + ECSDeployment + PassRole on execution+task role ARNs)
  - Create terraform/modules/iam/variables.tf: project_name, environment, primary_region, github_org, github_repo, create_github_oidc_provider (bool), jwt_secret_arn, dynamodb_table_arns (list(string)), ecr_repository_arn
  - Create terraform/modules/iam/outputs.tf: ecs_task_execution_role_arn, ecs_task_role_arn, github_actions_role_arn
  - **Requirements**: 2, 7, 16

- [ ] 7. Create observability module at terraform/modules/observability/
  - Create terraform/modules/observability/main.tf with CloudWatch/SNS resources from main.tf: aws_cloudwatch_metric_alarm ecs_cpu_high (GreaterThanThreshold, eval_periods=2, CPUUtilization AWS/ECS, period=60, Average, threshold=80, treat_missing=notBreaching, dims ClusterName+ServiceName, alarm+ok_actions=[sns]), aws_cloudwatch_metric_alarm alb_5xx (GreaterThanThreshold, eval_periods=1, HTTPCode_Target_5XX_Count AWS/ApplicationELB, period=300, Sum, threshold=10, treat_missing=notBreaching, dim LoadBalancer=var.alb_arn_suffix), aws_sns_topic alerts, aws_sns_topic_subscription alerts_email (count=alert_email!=""?1:0, email protocol), aws_cloudwatch_dashboard main (two widgets: ECS CPU+Memory and ALB RequestCount+TargetResponseTime using var.primary_region)
  - Create terraform/modules/observability/variables.tf: project_name, environment, primary_region, ecs_cluster_name, ecs_service_name, alb_arn_suffix, alert_email, sns_topic_name (default "")
  - Create terraform/modules/observability/outputs.tf: sns_alerts_topic_arn, cloudwatch_dashboard_name
  - **Requirements**: 2, 8, 16

- [ ] 8. Create global-services module at terraform/modules/global-services/
  - Create terraform/modules/global-services/main.tf with all global/cross-region resources from main.tf and storage.tf: aws_secretsmanager_secret jwt_secret (recovery_window_in_days=env=="prod"?30:0), aws_secretsmanager_secret_version, aws_acm_certificate api (DNS validation, lifecycle create_before_destroy=true), data/resource aws_route53_zone main (count on create_route53_zone), locals route53_zone_id, aws_route53_record api_cert_validation (for_each on domain_validation_options), aws_acm_certificate_validation api, aws_route53_record api (A alias to GA dns_name zone_id="Z2BJ6XQ5FK7U4H"), aws_globalaccelerator_accelerator main (IPV4 enabled, flow_logs to alb_logs bucket prefix "global-accelerator"), aws_globalaccelerator_listener https (TCP ports 443+80), aws_globalaccelerator_endpoint_group primary (region=var.primary_region traffic_dial=100, endpoint alb_arn weight=100 client_ip_preservation=true, healthcheck /actuator/health 443 HTTPS interval=30 threshold=3), aws_s3_bucket alb_logs (force_destroy=var.alb_logs_bucket_force_destroy), aws_s3_bucket_server_side_encryption_configuration (AES256), aws_s3_bucket_public_access_block (all true), data aws_elb_service_account, aws_s3_bucket_policy alb_logs (Allow ELB PutObject on arn/alb/AWSLogs/*), aws_amplify_app frontend (pnpm build_spec NEXT_PUBLIC_API_URL+NODE_ENV, custom_rule 404-200), aws_amplify_branch main (Next.js SSG, stage=env=="prod"?"PRODUCTION":"DEVELOPMENT", enable_auto_build=true), aws_amplify_domain_association frontend
  - Create terraform/modules/global-services/variables.tf: project_name, environment, primary_region, domain_name, api_subdomain, frontend_subdomain, create_route53_zone (bool), alb_arn, alb_logs_bucket_force_destroy (bool), jwt_secret (sensitive=true), github_org, github_repo, github_token (sensitive=true), amplify_branch, alert_email
  - Create terraform/modules/global-services/outputs.tf: jwt_secret_arn (sensitive=true), certificate_arn, route53_zone_id, alb_logs_bucket_id, alb_logs_bucket_arn, global_accelerator_dns_name, global_accelerator_static_ips, api_url, frontend_url, amplify_app_id, amplify_default_domain
  - **Requirements**: 2, 9, 16

- [ ] 9. Create dev/ap-southeast-1 environment-region directory (primary)
  - Create terraform/environments/dev/ap-southeast-1/backend.tf: terraform { backend "s3" { key="dev/ap-southeast-1/terraform.tfstate" encrypt=true } } with comment explaining -backend-config usage
  - Create terraform/environments/dev/ap-southeast-1/provider.tf: terraform block (>=1.5.0, aws ~>5.0), provider aws (region=var.primary_region, default_tags Project/Environment/ManagedBy), provider aws alias=secondary (region=var.secondary_region), provider aws alias=us_east_1 (region="us-east-1")
  - Create terraform/environments/dev/ap-southeast-1/main.tf instantiating all 7 modules with cross-module wiring: module "database" (../../../modules/database), module "network" (../../../modules/network), module "global_services" (../../../modules/global-services, alb_arn=module.compute.alb_arn, alb_logs_bucket_force_destroy=var.environment!="prod", jwt_secret=var.jwt_secret, github_token=var.github_token), module "iam" (../../../modules/iam, jwt_secret_arn=module.global_services.jwt_secret_arn, dynamodb_table_arns=[module.database.users_table_arn,categories_table_arn,transactions_table_arn], ecr_repository_arn=module.compute.ecr_repository_arn), module "compute" (../../../modules/compute, vpc_id=module.network.vpc_id, public_subnet_ids=module.network.public_subnet_ids, private_subnet_ids=module.network.private_subnet_ids, alb_sg_id=module.network.alb_sg_id, ecs_sg_id=module.network.ecs_sg_id, ecs_task_execution_role_arn=module.iam.ecs_task_execution_role_arn, ecs_task_role_arn=module.iam.ecs_task_role_arn, certificate_arn=module.global_services.certificate_arn, jwt_secret_arn=module.global_services.jwt_secret_arn, alb_logs_bucket_id=module.global_services.alb_logs_bucket_id), module "security" (../../../modules/security, alb_arn=module.compute.alb_arn), module "observability" (../../../modules/observability, ecs_cluster_name=module.compute.ecs_cluster_name, ecs_service_name=module.compute.ecs_service_name, alb_arn_suffix=module.compute.alb_arn_suffix)
  - Create terraform/environments/dev/ap-southeast-1/variables.tf with 33 variables: project_name, environment, primary_region, secondary_region, vpc_cidr, public_subnet_cidrs (list), private_subnet_cidrs (list), domain_name, api_subdomain, frontend_subdomain, create_route53_zone (bool), ecr_image_tag_mutability, backend_image_tag, ecs_cpu (num), ecs_memory (num), ecs_desired_count (num), ecs_min_capacity (num), ecs_max_capacity (num), container_port (num), log_retention_days (num), dynamodb_table_users, dynamodb_table_categories, dynamodb_table_transactions, dynamodb_enable_global_tables (bool), dynamodb_point_in_time_recovery (bool), jwt_secret (sensitive=true no default), waf_rate_limit (num), github_org, github_repo, github_token (sensitive=true no default), create_github_oidc_provider (bool), amplify_branch, alert_email
  - Create terraform/environments/dev/ap-southeast-1/terraform.tfvars: environment="dev", primary_region="ap-southeast-1", secondary_region="ap-northeast-1", vpc_cidr="10.0.0.0/16", public_subnet_cidrs=["10.0.1.0/24","10.0.2.0/24"], private_subnet_cidrs=["10.0.11.0/24","10.0.12.0/24"], ecs_cpu=256, ecs_memory=512, ecs_desired_count=1, ecs_min_capacity=1, ecs_max_capacity=2, dynamodb_enable_global_tables=false, dynamodb_point_in_time_recovery=false, log_retention_days=7, ecr_image_tag_mutability="MUTABLE", backend_image_tag="latest", create_github_oidc_provider=true, amplify_branch="develop", alert_email="". Add comment: jwt_secret and github_token supplied via TF_VAR_ environment variables.
  - Create terraform/environments/dev/ap-southeast-1/outputs.tf with 27 outputs via module references: vpc_id=module.network.vpc_id, public_subnet_ids=module.network.public_subnet_ids, private_subnet_ids=module.network.private_subnet_ids, nat_gateway_public_ips=module.network.nat_gateway_public_ips, ecr_repository_url/arn=module.compute.*, ecs_cluster_name/service_name/task_execution_role_arn/task_role_arn=module.compute.*, alb_dns_name/alb_arn=module.compute.*, global_accelerator_dns_name/static_ips=module.global_services.*, api_url/frontend_url/route53_zone_id=module.global_services.*, dynamodb_*_table_name/arn=module.database.*, jwt_secret_arn (sensitive=true)=module.global_services.jwt_secret_arn, github_actions_role_arn=module.iam.github_actions_role_arn, cloudwatch_dashboard_url="https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${module.observability.cloudwatch_dashboard_name}", sns_alerts_topic_arn=module.observability.sns_alerts_topic_arn, amplify_app_id/amplify_default_domain=module.global_services.*
  - **Requirements**: 10, 11, 12, 13, 14, 15, 16

- [ ] 10. Create dev/ap-northeast-1 environment-region directory (secondary, no global_services)
  - Create terraform/environments/dev/ap-northeast-1/backend.tf: key="dev/ap-northeast-1/terraform.tfstate" encrypt=true
  - Create terraform/environments/dev/ap-northeast-1/provider.tf: primary=var.primary_region (ap-northeast-1), secondary alias=var.secondary_region (ap-southeast-1), us_east_1 alias
  - Create terraform/environments/dev/ap-northeast-1/main.tf: instantiate 6 modules (database, network, iam, compute, security, observability — NO global_services). iam gets jwt_secret_arn=var.jwt_secret_arn. compute gets certificate_arn=var.certificate_arn, jwt_secret_arn=var.jwt_secret_arn, alb_logs_bucket_id=var.alb_logs_bucket_id. All other module wiring identical to dev/ap-southeast-1.
  - Create terraform/environments/dev/ap-northeast-1/variables.tf: same 33 variables as dev/ap-southeast-1 PLUS 3 additional: certificate_arn (string, from primary region), jwt_secret_arn (string, from primary region), alb_logs_bucket_id (string, from primary region)
  - Create terraform/environments/dev/ap-northeast-1/terraform.tfvars: primary_region="ap-northeast-1", secondary_region="ap-southeast-1", vpc_cidr="10.1.0.0/16", public_subnet_cidrs=["10.1.1.0/24","10.1.2.0/24"], private_subnet_cidrs=["10.1.11.0/24","10.1.12.0/24"], environment="dev", same low-capacity dev sizing, create_github_oidc_provider=false. Add commented placeholders for certificate_arn, jwt_secret_arn, alb_logs_bucket_id with instruction to populate from primary region terraform output.
  - Create terraform/environments/dev/ap-northeast-1/outputs.tf: 27 outputs — local module outputs via module.* where available; cross-region outputs (global_accelerator_*, api_url, frontend_url, route53_zone_id, jwt_secret_arn, amplify_*) reference var.* directly (e.g. jwt_secret_arn=var.jwt_secret_arn sensitive=true)
  - **Requirements**: 10, 11, 12, 13, 14, 15, 16, 18

- [ ] 11. Create prod/ap-southeast-1 environment-region directory (primary, production)
  - Create terraform/environments/prod/ap-southeast-1/backend.tf: key="prod/ap-southeast-1/terraform.tfstate" encrypt=true
  - Create terraform/environments/prod/ap-southeast-1/provider.tf: identical structure to dev/ap-southeast-1 (primary=ap-southeast-1, secondary=ap-northeast-1, us_east_1)
  - Create terraform/environments/prod/ap-southeast-1/main.tf: identical 7-module instantiation and wiring as dev/ap-southeast-1
  - Create terraform/environments/prod/ap-southeast-1/variables.tf: identical 33 variable declarations as dev/ap-southeast-1
  - Create terraform/environments/prod/ap-southeast-1/terraform.tfvars: environment="prod", primary_region="ap-southeast-1", secondary_region="ap-northeast-1", vpc_cidr="10.0.0.0/16" (same subnet CIDRs — separate accounts), ecs_cpu=512, ecs_memory=1024, ecs_desired_count=2, ecs_min_capacity=2, ecs_max_capacity=6, dynamodb_enable_global_tables=true, dynamodb_point_in_time_recovery=true, log_retention_days=30, ecr_image_tag_mutability="IMMUTABLE", backend_image_tag="v1.0.0", dynamodb_table_users="moneytrack-users", dynamodb_table_categories="moneytrack-categories", dynamodb_table_transactions="moneytrack-transactions", create_github_oidc_provider=false, amplify_branch="main", alert_email="infra-alerts@moneytrack.com"
  - Create terraform/environments/prod/ap-southeast-1/outputs.tf: identical 27 outputs as dev/ap-southeast-1
  - **Requirements**: 10, 11, 12, 13, 14, 15, 16

- [ ] 12. Create prod/ap-northeast-1 environment-region directory (secondary, production)
  - Create terraform/environments/prod/ap-northeast-1/backend.tf: key="prod/ap-northeast-1/terraform.tfstate" encrypt=true
  - Create terraform/environments/prod/ap-northeast-1/provider.tf: primary=ap-northeast-1, secondary=ap-southeast-1, us_east_1 alias
  - Create terraform/environments/prod/ap-northeast-1/main.tf: identical 6-module structure as dev/ap-northeast-1 (no global_services), same cross-module wiring
  - Create terraform/environments/prod/ap-northeast-1/variables.tf: same 36 variables as dev/ap-northeast-1 (33 + 3 cross-region)
  - Create terraform/environments/prod/ap-northeast-1/terraform.tfvars: environment="prod", primary_region="ap-northeast-1", secondary_region="ap-southeast-1", vpc_cidr="10.1.0.0/16", public_subnet_cidrs=["10.1.1.0/24","10.1.2.0/24"], private_subnet_cidrs=["10.1.11.0/24","10.1.12.0/24"], ecs_cpu=512, ecs_memory=1024, ecs_desired_count=2, ecs_min_capacity=2, ecs_max_capacity=6, dynamodb_enable_global_tables=true, dynamodb_point_in_time_recovery=true, log_retention_days=30, ecr_image_tag_mutability="IMMUTABLE", dynamodb_table_users="moneytrack-users" (same as primary — Global Tables), create_github_oidc_provider=false, amplify_branch="main", alert_email="infra-alerts@moneytrack.com". Commented placeholders for certificate_arn, jwt_secret_arn, alb_logs_bucket_id.
  - Create terraform/environments/prod/ap-northeast-1/outputs.tf: same 27 outputs as dev/ap-northeast-1
  - **Requirements**: 10, 11, 12, 13, 14, 15, 16, 18

- [ ] 13. Create migration guide document
  - Create terraform/MIGRATION.md with the complete migration strategy: Step 1 apply bootstrap layer (terraform init + apply in terraform/bootstrap/, record outputs); Step 2 create backend.hcl referencing bootstrap outputs (bucket, dynamodb_table, region); Step 3 copy existing state to new S3 keys (aws s3 cp commands for each env-region); Step 4 initialize each of the 4 env-region directories (terraform init -backend-config=../../../backend.hcl); Step 5 complete terraform state mv mapping table (all 73 flat-resource addresses to module.* addresses for all modules); Step 6 terraform import guidance for pre-existing resources (examples for DynamoDB tables, IAM OIDC provider, S3 buckets); Step 7 run terraform plan and verify 0 changes; Step 8 first-apply order for clean environments (database → network → global_services → iam → compute → security → observability, or full terraform apply); Step 9 post-migration verification checklist (10 items: ECS running, ALB health checks, HTTPS cert valid, DynamoDB in both regions, CloudWatch alarms OK, SNS subscription, Global Accelerator healthy, Amplify connected, jwt_secret_arn output, GitHub OIDC auth)
  - **Requirements**: 17

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 3, 4, 5, 6, 7, 8, 13] },
    { "wave": 2, "tasks": [9, 10, 11, 12] }
  ],
  "dependencies": {
    "9": [2, 3, 4, 5, 6, 7, 8],
    "10": [2, 3, 4, 5, 6, 7],
    "11": [2, 3, 4, 5, 6, 7, 8],
    "12": [2, 3, 4, 5, 6, 7]
  }
}
```

Wave 1: Bootstrap layer, all 7 modules, and migration guide — all independent, run in parallel. Wave 2: All 4 environment-region directories — depend on the modules from wave 1.

## Notes

- Security groups (alb, ecs, vpc_endpoint) are placed in the network module — not the security module — to break the circular dependency between security.tf (which references aws_vpc.main.id) and network.tf (which references aws_security_group.vpc_endpoint.id).
- The security module contains only WAF resources.
- DynamoDB Global Tables replication uses the dynamic "replica" block with a region name string — no Terraform provider alias is needed inside the database module.
- Secondary region directories (tasks 10 and 12) do not instantiate global_services. Cross-region values (certificate_arn, jwt_secret_arn, alb_logs_bucket_id) are supplied as variables populated from the primary region's terraform output.
- Sensitive variables (jwt_secret, github_token) must never appear in terraform.tfvars — supply via TF_VAR_ environment variables or a secrets manager integration.
- The bootstrap layer must be applied exactly once per AWS account before any environment-region directory is initialized.
