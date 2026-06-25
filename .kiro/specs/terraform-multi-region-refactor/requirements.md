# Requirements Document

## Introduction

This feature refactors the existing MoneyTrack Terraform project from a flat single-directory
structure into a layered, multi-region layout. The refactoring must preserve every resource,
dependency, and behavior already present in the codebase — no new AWS services may be
introduced. The target layout introduces three distinct concerns:

1. A **bootstrap layer** that provisions the remote-state backend (S3 + DynamoDB lock table)
   and is kept permanently isolated from application infrastructure.
2. A **reusable modules layer** whose boundaries are derived strictly from the six `.tf` files
   that already define MoneyTrack's infrastructure: `network.tf`, `security.tf`, `compute.tf`,
   `database.tf`, `iam.tf`, `storage.tf`, and `main.tf`.
3. An **environments layer** that composes those modules for each combination of environment
   (`dev`, `prod`) and AWS region (`ap-southeast-1`, `ap-northeast-1`), with fully isolated
   Terraform state per environment-region pair.

---

## Glossary

- **Bootstrap_Layer**: The Terraform root module at `terraform/bootstrap/` responsible solely
  for creating the S3 state bucket and DynamoDB lock table used as the remote backend.
- **Module**: A self-contained, reusable Terraform module under `terraform/modules/<name>/`.
  Module boundaries are derived exclusively from the existing source files.
- **Environment_Region_Directory**: A directory of the form
  `terraform/environments/<env>/<region>/` (e.g. `terraform/environments/dev/ap-southeast-1/`).
- **Network_Module**: The module derived from the existing `network.tf` — covers VPC, subnets,
  Internet Gateway, NAT Gateways, route tables, and VPC Endpoints.
- **Security_Module**: The module derived from `security.tf` — covers Security Groups (ALB, ECS,
  VPC Endpoint) and WAF Web ACL with ALB association.
- **Compute_Module**: The module derived from `compute.tf` — covers ECR repository and lifecycle
  policy, ECS cluster, ECS task definition, ALB (listeners, target group), ECS service, and
  App Auto Scaling.
- **Database_Module**: The module derived from `database.tf` — covers the three DynamoDB tables
  (users, categories, transactions) with GSIs, encryption, PITR, and Global Tables replication.
- **IAM_Module**: The module derived from `iam.tf` — covers ECS task execution role, ECS task
  role, GitHub Actions OIDC provider, and GitHub Actions IAM role.
- **Observability_Module**: The module derived from the CloudWatch and SNS resources in `main.tf`
  — covers CloudWatch log group, alarms, dashboard, and SNS alert topic.
- **Global_Services_Module**: The module derived from the ACM, Route 53, Global Accelerator,
  Secrets Manager, S3 ALB logs bucket, and Amplify resources in `main.tf` and `storage.tf`.
  These resources are inherently global or cross-region and are deployed once per environment.
- **Remote_State_Backend**: The S3 bucket and DynamoDB table provisioned by the Bootstrap_Layer,
  used to store and lock Terraform state for all Environment_Region_Directories.
- **State_Key**: The S3 object key for a given state file, following the pattern
  `<env>/<region>/terraform.tfstate` (e.g. `dev/ap-southeast-1/terraform.tfstate`).
- **Flat_Structure**: The current single-directory Terraform project at `terraform/` with ten
  `.tf` files — the source of truth for all refactoring decisions.
- **Provider_Alias**: A named AWS provider configuration targeting a specific region, used inside
  modules that must create resources in more than one region simultaneously.

---

## Requirements

### Requirement 1: Bootstrap Layer

**User Story:** As an infrastructure engineer, I want a dedicated bootstrap layer that provisions
only the Terraform remote-state backend resources, so that backend infrastructure is never
accidentally destroyed or modified during normal application deployments.

#### Acceptance Criteria

1. THE Bootstrap_Layer SHALL be located at `terraform/bootstrap/` and SHALL contain at minimum
   `main.tf`, `variables.tf`, `outputs.tf`, and `terraform.tfvars`.
2. THE Bootstrap_Layer SHALL provision exactly one S3 bucket configured with versioning enabled,
   server-side encryption (AES256), and all public-access blocks set to `true`.
3. THE Bootstrap_Layer SHALL provision exactly one DynamoDB table with `LockID` as the hash key,
   `PAY_PER_REQUEST` billing, and used exclusively as the Terraform state lock table.
4. WHEN the Bootstrap_Layer is applied, THE Bootstrap_Layer SHALL output the S3 bucket name, the
   S3 bucket ARN, and the DynamoDB lock table name so that Environment_Region_Directories can
   reference them in `backend.tf`.
5. THE Bootstrap_Layer SHALL NOT reference or depend on any resource defined in the
   Network_Module, Security_Module, Compute_Module, Database_Module, IAM_Module,
   Observability_Module, or Global_Services_Module — this prohibition is absolute and applies
   regardless of whether the Bootstrap_Layer provisioning succeeds or fails.
6. THE Bootstrap_Layer SHALL use a local backend (`backend "local" {}`) so that the bootstrap
   state itself is stored locally and not inside the bucket it creates.

---

### Requirement 2: Reusable Modules Derived from Existing Code

**User Story:** As an infrastructure engineer, I want each logical infrastructure component to
become a reusable Terraform module derived from the existing implementation, so that the same
module can be instantiated in multiple Environment_Region_Directories without duplicating code.

#### Acceptance Criteria

1. THE Refactored_Layout SHALL contain exactly the following modules under `terraform/modules/`,
   each derived from the listed source file(s):

   | Module directory              | Derived from (existing files)        |
   |-------------------------------|--------------------------------------|
   | `terraform/modules/network/`        | `network.tf`                   |
   | `terraform/modules/security/`       | `security.tf`                  |
   | `terraform/modules/compute/`        | `compute.tf`                   |
   | `terraform/modules/database/`       | `database.tf`                  |
   | `terraform/modules/iam/`            | `iam.tf`                       |
   | `terraform/modules/observability/`  | CloudWatch/SNS blocks in `main.tf` |
   | `terraform/modules/global-services/`| ACM, Route53, Global Accelerator, Secrets Manager, S3 ALB logs, Amplify blocks in `main.tf` and `storage.tf` |

2. WHEN a module is created, THE Module SHALL expose as input variables every value currently
   passed via `var.*` references in the source file(s) from which it is derived (e.g. `vpc_cidr`,
   `project_name`, `environment`, `primary_region`, `container_port`, etc.).
3. WHEN a module is created, THE Module SHALL expose as outputs every resource attribute
   currently referenced by another `.tf` file in the Flat_Structure (e.g. the Network_Module
   SHALL output `vpc_id`, `public_subnet_ids`, `private_subnet_ids`, and `nat_gateway_public_ips`
   because those are consumed by `compute.tf` and `outputs.tf`).
4. THE Module SHALL NOT introduce new AWS resources, data sources, or provider aliases beyond
   those already present in the Flat_Structure source files — this prohibition on new data
   sources applies even when an existing resource could benefit from additional data lookups.
5. WHEN cross-module references exist (e.g. `compute.tf` references `aws_vpc.main.id` from
   `network.tf`), THE consuming module SHALL receive those values through its input variables,
   not by accessing remote state directly.

---

### Requirement 3: Network Module Contents

**User Story:** As an infrastructure engineer, I want the Network_Module to encapsulate all VPC
networking resources exactly as they exist today, so that no networking behavior is changed
during refactoring.

#### Acceptance Criteria

1. THE Network_Module SHALL contain all resources currently defined in `network.tf`: `aws_vpc`,
   `aws_subnet` (public and private), `aws_internet_gateway`, `aws_eip` (NAT), `aws_nat_gateway`,
   `aws_route_table` (public and private), `aws_route_table_association` (public and private),
   and all seven `aws_vpc_endpoint` resources (dynamodb, ecr_api, ecr_dkr, logs, secretsmanager,
   ssm, s3).
2. THE Network_Module SHALL accept `primary_region` as an input variable and USE it in
   VPC Endpoint `service_name` attributes (e.g. `com.amazonaws.${var.primary_region}.dynamodb`)
   so that the module is deployable to any AWS region without hard-coding region strings.
3. THE Network_Module SHALL output `vpc_id`, `public_subnet_ids`, `private_subnet_ids`,
   `nat_gateway_public_ips`, `private_route_table_ids`, and `vpc_endpoint_security_group_id`
   because these values are consumed by the Security_Module, Compute_Module, and
   Global_Services_Module.

---

### Requirement 4: Security Module Contents

**User Story:** As an infrastructure engineer, I want the Security_Module to encapsulate all
Security Group and WAF resources exactly as they exist today, so that no firewall or access
control behavior is changed during refactoring.

#### Acceptance Criteria

1. THE Security_Module SHALL contain all resources currently defined in `security.tf`:
   `aws_security_group` (alb, ecs, vpc_endpoint) and `aws_wafv2_web_acl` with
   `aws_wafv2_web_acl_association`.
2. THE Security_Module SHALL accept `vpc_id`, `vpc_cidr`, `container_port`, `alb_arn`,
   `project_name`, `environment`, and `waf_rate_limit` as input variables.
3. THE Security_Module SHALL output `alb_sg_id`, `ecs_sg_id`, and `vpc_endpoint_sg_id` for
   consumption by the Network_Module and Compute_Module.
4. THE Security_Module SHALL preserve all three WAF rule priorities and rule group names
   (`AWSManagedRulesCommonRuleSet`, `AWSManagedRulesKnownBadInputsRuleSet`) exactly as defined
   in the Flat_Structure.

---

### Requirement 5: Compute Module Contents

**User Story:** As an infrastructure engineer, I want the Compute_Module to encapsulate all
container and load-balancer resources exactly as they exist today, so that no runtime or
deployment behavior is changed during refactoring.

#### Acceptance Criteria

1. THE Compute_Module SHALL contain all resources currently defined in `compute.tf`: ECR
   repository and lifecycle policy, ECS cluster and capacity providers, CloudWatch log group
   for ECS, ECS task definition, ALB (including `aws_lb`, `aws_lb_target_group`,
   `aws_lb_listener` for HTTP and HTTPS), ECS service, and App Auto Scaling target and policies.
2. THE Compute_Module SHALL accept as input variables all values currently sourced from
   `var.*` in `compute.tf`, including `project_name`, `environment`, `ecr_image_tag_mutability`,
   `ecs_cpu`, `ecs_memory`, `ecs_desired_count`, `ecs_min_capacity`, `ecs_max_capacity`,
   `container_port`, `backend_image_tag`, `primary_region`, `log_retention_days`, and the ARNs
   and IDs produced by the Network_Module, Security_Module, IAM_Module, and the
   Global_Services_Module (e.g. `certificate_arn`, `jwt_secret_arn`, `alb_logs_bucket_id`).
3. THE Compute_Module SHALL output `alb_dns_name`, `alb_arn`, `alb_arn_suffix`,
   `ecs_cluster_name`, `ecs_service_name`, `ecr_repository_url`, `ecr_repository_arn`,
   `ecs_task_execution_role_arn`, and `ecs_task_role_arn`.
4. THE Compute_Module SHALL preserve the `enable_deletion_protection` conditional
   (`var.environment == "prod" ? true : false`) on the ALB exactly as it exists in the
   Flat_Structure.

---

### Requirement 6: Database Module Contents

**User Story:** As an infrastructure engineer, I want the Database_Module to encapsulate all
DynamoDB table definitions exactly as they exist today, so that no data model, index, or
replication behavior is changed during refactoring.

#### Acceptance Criteria

1. THE Database_Module SHALL contain all three `aws_dynamodb_table` resources currently defined
   in `database.tf` (users, categories, transactions) with their GSIs, encryption, PITR settings,
   stream configuration, and `dynamic "replica"` blocks.
2. THE Database_Module SHALL accept `secondary_region`, `dynamodb_enable_global_tables`,
   `dynamodb_point_in_time_recovery`, `dynamodb_table_users`, `dynamodb_table_categories`,
   `dynamodb_table_transactions`, `project_name`, and `environment` as input variables.
3. THE Database_Module SHALL output the `name` and `arn` for each of the three tables
   (`users_table_name`, `users_table_arn`, `categories_table_name`, `categories_table_arn`,
   `transactions_table_name`, `transactions_table_arn`).
4. THE Database_Module SHALL preserve `lifecycle { prevent_destroy = true }` on all three tables
   exactly as defined in the Flat_Structure to protect production data.

---

### Requirement 7: IAM Module Contents

**User Story:** As an infrastructure engineer, I want the IAM_Module to encapsulate all IAM
roles and policies exactly as they exist today, so that no permissions are altered during
refactoring.

#### Acceptance Criteria

1. THE IAM_Module SHALL contain all resources currently defined in `iam.tf`: ECS task execution
   role, ECS task role, all four inline policies attached to those roles (secrets, DynamoDB,
   SSM, CloudWatch), GitHub Actions OIDC provider (with `count` conditional), and the
   GitHub Actions IAM role and ECR/ECS push policy.
2. THE IAM_Module SHALL accept `project_name`, `environment`, `primary_region`, `github_org`,
   `github_repo`, `create_github_oidc_provider`, `jwt_secret_arn`, `dynamodb_table_arns`
   (a list of ARNs for the three tables), and `ecr_repository_arn` as input variables.
3. THE IAM_Module SHALL output `ecs_task_execution_role_arn`, `ecs_task_role_arn`, and
   `github_actions_role_arn`.
4. THE IAM_Module SHALL preserve the `count`-based conditional on `aws_iam_openid_connect_provider`
   and the corresponding data source lookup exactly as defined in the Flat_Structure.

---

### Requirement 8: Observability Module Contents

**User Story:** As an infrastructure engineer, I want the Observability_Module to encapsulate all
monitoring and alerting resources exactly as they exist today, so that no alarm thresholds,
dashboard widgets, or notification channels are changed during refactoring.

#### Acceptance Criteria

1. THE Observability_Module SHALL contain the CloudWatch metric alarms (`ecs_cpu_high`,
   `alb_5xx`), the CloudWatch dashboard, the SNS topic, and the conditional SNS email
   subscription — all currently defined in `main.tf`.
2. THE Observability_Module SHALL accept `project_name`, `environment`, `primary_region`,
   `ecs_cluster_name`, `ecs_service_name`, `alb_arn_suffix`, `alert_email`, and
   `sns_topic_name` as input variables.
3. THE Observability_Module SHALL output `sns_alerts_topic_arn` and
   `cloudwatch_dashboard_name`.
4. THE Observability_Module SHALL preserve the ECS CPU alarm threshold (80%), ALB 5xx alarm
   threshold (10 errors per 5-minute period — this is an absolute count, not a percentage, and
   the constraint prevents this threshold from being changed during refactoring), and evaluation
   period counts exactly as defined in the Flat_Structure.

---

### Requirement 9: Global Services Module Contents

**User Story:** As an infrastructure engineer, I want the Global_Services_Module to encapsulate
all resources that are global or cross-region in scope exactly as they exist today, so that no
DNS, certificate, accelerator, or frontend deployment behavior is changed during refactoring.

#### Acceptance Criteria

1. THE Global_Services_Module SHALL contain: `aws_secretsmanager_secret` and version,
   `aws_acm_certificate` and validation, `aws_route53_zone` (with count), Route 53 data source,
   Route 53 validation records, `aws_route53_record` for the API, `aws_globalaccelerator_accelerator`,
   `aws_globalaccelerator_listener`, `aws_globalaccelerator_endpoint_group`, `aws_s3_bucket`
   for ALB logs with all its sub-resources (encryption, public access block, bucket policy),
   `aws_amplify_app`, `aws_amplify_branch`, and `aws_amplify_domain_association` — all currently
   defined in `main.tf` and `storage.tf`.
2. THE Global_Services_Module SHALL accept `project_name`, `environment`, `primary_region`,
   `domain_name`, `api_subdomain`, `frontend_subdomain`, `create_route53_zone`, `alb_arn`,
   `alb_logs_bucket_force_destroy`, `jwt_secret`, `github_org`, `github_repo`, `github_token`,
   `amplify_branch`, and `alert_email` as input variables.
3. THE Global_Services_Module SHALL output `jwt_secret_arn`, `certificate_arn`,
   `route53_zone_id`, `alb_logs_bucket_id`, `alb_logs_bucket_arn`,
   `global_accelerator_dns_name`, `global_accelerator_static_ips`, `api_url`,
   `frontend_url`, `amplify_app_id`, and `amplify_default_domain`.
4. THE Global_Services_Module SHALL preserve the `recovery_window_in_days` conditional
   (`var.environment == "prod" ? 30 : 0`) on `aws_secretsmanager_secret` exactly as defined
   in the Flat_Structure.

---

### Requirement 10: Environment-Region Directory Structure

**User Story:** As an infrastructure engineer, I want each environment-region combination to have
its own self-contained Terraform root module, so that applying infrastructure in one region and
environment never affects another.

#### Acceptance Criteria

1. THE Refactored_Layout SHALL contain exactly the following Environment_Region_Directories:
   - `terraform/environments/dev/ap-southeast-1/`
   - `terraform/environments/dev/ap-northeast-1/`
   - `terraform/environments/prod/ap-southeast-1/`
   - `terraform/environments/prod/ap-northeast-1/`
2. WHEN a new AWS region must be added in the future, THE Refactored_Layout SHALL require
   creating only a new directory following the same structure, without modifying any existing
   Environment_Region_Directory or module.
3. THE Refactored_Layout SHALL contain exactly the following files in every
   Environment_Region_Directory: `backend.tf`, `provider.tf`, `main.tf`, `variables.tf`,
   `outputs.tf`, and `terraform.tfvars`.

---

### Requirement 11: Backend Configuration per Environment-Region

**User Story:** As an infrastructure engineer, I want each environment-region directory to have
its own isolated Terraform state, so that a `terraform apply` in one environment-region can
never corrupt or overwrite the state of another.

#### Acceptance Criteria

1. WHEN the Terraform backend is configured for an Environment_Region_Directory, THE
   Environment_Region_Directory SHALL contain a `backend.tf` file specifying an S3 backend with
   `encrypt = true`.
2. THE State_Key for each Environment_Region_Directory SHALL follow the pattern
   `<env>/<region>/terraform.tfstate` (e.g. `dev/ap-southeast-1/terraform.tfstate` for the
   dev Singapore directory).
3. THE `backend.tf` in every Environment_Region_Directory SHALL reference the same S3 bucket
   name and DynamoDB table name that are output by the Bootstrap_Layer, ensuring all state is
   consolidated in the backend resources created by bootstrap.
4. WHEN two Environment_Region_Directories reference the same S3 bucket, THE State_Key values
   for those directories SHALL be distinct so that no two directories share a state file path.
   WHERE two directories use different S3 buckets, THE Refactored_Layout SHALL still require
   that the State_Key within each bucket is unique across all directories using that bucket.
5. THE `backend.tf` SHALL NOT hard-code values for the S3 bucket name or DynamoDB table name;
   instead, those values SHALL be documented as parameters to be supplied via
   `terraform init -backend-config` or a `backend.hcl` partial configuration file, so that the
   bootstrap outputs can be injected without modifying source files.

---

### Requirement 12: Provider Configuration per Environment-Region

**User Story:** As an infrastructure engineer, I want each environment-region directory to
configure its AWS provider independently, so that switching regions requires only changing the
provider configuration in that directory with no impact on other directories.

#### Acceptance Criteria

1. EVERY Environment_Region_Directory SHALL contain a `provider.tf` that configures the primary
   AWS provider with the `region` value set to the region of that directory
   (e.g. `ap-southeast-1` for the `ap-southeast-1/` directory).
2. THE `provider.tf` SHALL include a `required_providers` block pinning the AWS provider to
   `~> 5.0`, consistent with the constraint already present in the Flat_Structure.
3. THE `provider.tf` in directories that instantiate the Database_Module SHALL include a
   secondary provider alias (`alias = "secondary"`) targeting the opposite region, because the
   Database_Module uses DynamoDB Global Tables replication across two regions.
4. THE `provider.tf` in directories that instantiate the Global_Services_Module SHALL include a
   `us-east-1` provider alias (`alias = "us_east_1"`) as required for ACM certificates used
   with CloudFront — consistent with the Flat_Structure.
5. WHEN a new region is added, THE `provider.tf` in the new directory SHALL only need to change
   the primary region value and the secondary region value of any alias provider, with no
   changes required to any other directory.

---

### Requirement 13: Composition in main.tf

**User Story:** As an infrastructure engineer, I want each Environment_Region_Directory's
`main.tf` to compose the correct set of modules and pass outputs between them, so that all
inter-module dependencies are satisfied explicitly.

#### Acceptance Criteria

1. THE `main.tf` in each Environment_Region_Directory SHALL instantiate all modules required to
   reproduce the resources currently in the Flat_Structure for that environment and region.
2. WHEN a module depends on outputs from another module (e.g. Compute_Module requires `vpc_id`
   from Network_Module), THE `main.tf` SHALL wire those outputs as input variable values
   (`module.network.vpc_id`) rather than using `data` sources to look up existing resources.
3. THE `main.tf` SHALL NOT contain inline resource definitions; all resources SHALL be defined
   inside modules.
4. WHEN the same module (e.g. Observability_Module) is instantiated in multiple
   Environment_Region_Directories, THE module sources SHALL reference the shared
   `terraform/modules/` path using a relative path (`../../modules/observability`).

---

### Requirement 14: Variables and tfvars per Environment-Region

**User Story:** As an infrastructure engineer, I want each environment-region directory to have
its own `variables.tf` and `terraform.tfvars`, so that environment-specific and region-specific
values (e.g. VPC CIDRs, desired task counts) can differ without affecting other deployments.

#### Acceptance Criteria

1. EVERY Environment_Region_Directory SHALL contain a `variables.tf` that declares all input
   variables consumed by the modules instantiated in that directory's `main.tf`.
2. EVERY Environment_Region_Directory SHALL contain a `terraform.tfvars` (or a
   `terraform.tfvars.example` with instructions to copy it) that provides concrete values for
   the declared variables.
3. THE `terraform.tfvars` for a `dev` environment SHALL differ from the `prod` environment in at
   least the values of `environment`, `ecs_desired_count`, `ecs_min_capacity`, `ecs_max_capacity`,
   and `dynamodb_point_in_time_recovery` to reflect lower-cost dev settings.
4. THE `terraform.tfvars` for `ap-southeast-1` directories SHALL differ from `ap-northeast-1`
   directories in the `primary_region` value and VPC CIDR ranges (to avoid CIDR conflicts if
   VPC peering or Transit Gateway is added later).
5. SENSITIVE variables (`jwt_secret`, `github_token`) SHALL be declared in `variables.tf` with
   `sensitive = true` and SHALL NOT have default values, consistent with their treatment in the
   Flat_Structure.

---

### Requirement 15: Outputs per Environment-Region

**User Story:** As an infrastructure engineer, I want each environment-region directory to
expose the same set of infrastructure outputs currently available in the Flat_Structure, so
that CI/CD pipelines and operators can retrieve endpoint URLs, ARNs, and resource names without
changing how they query Terraform.

#### Acceptance Criteria

1. THE `outputs.tf` in each Environment_Region_Directory SHALL expose at minimum the following
   values currently defined in the Flat_Structure's `outputs.tf`: `vpc_id`,
   `public_subnet_ids`, `private_subnet_ids`, `nat_gateway_public_ips`, `ecr_repository_url`,
   `ecr_repository_arn`, `ecs_cluster_name`, `ecs_service_name`, `ecs_task_execution_role_arn`,
   `ecs_task_role_arn`, `alb_dns_name`, `alb_arn`, `global_accelerator_dns_name`,
   `global_accelerator_static_ips`, `api_url`, `frontend_url`, `route53_zone_id`,
   `dynamodb_users_table_name`, `dynamodb_users_table_arn`, `dynamodb_categories_table_name`,
   `dynamodb_categories_table_arn`, `dynamodb_transactions_table_name`,
   `dynamodb_transactions_table_arn`, `jwt_secret_arn`, `github_actions_role_arn`,
   `cloudwatch_dashboard_url`, `sns_alerts_topic_arn`, `amplify_app_id`, and
   `amplify_default_domain`.
2. WHEN an output value is produced by a module, THE `outputs.tf` SHALL reference it via
   `module.<name>.<output>` rather than directly referencing a resource.
3. THE `jwt_secret_arn` output SHALL be marked `sensitive = true` consistent with the
   Flat_Structure.

---

### Requirement 16: Behavior Preservation

**User Story:** As an infrastructure engineer, I want the refactored layout to produce
functionally identical infrastructure to what the Flat_Structure produces today, so that no
application behavior, security posture, or operational characteristic is inadvertently changed.

#### Acceptance Criteria

1. THE Refactored_Layout SHALL preserve all resource tag schemas currently applied in the
   Flat_Structure (`Project`, `Environment`, `ManagedBy = "Terraform"`) via `default_tags` on
   the provider and explicit `tags` blocks on individual resources.
2. THE Refactored_Layout SHALL preserve the `depends_on` relationships currently present in the
   Flat_Structure (e.g. `aws_ecs_service` depends on `aws_lb_listener.https` and
   `aws_iam_role_policy_attachment.ecs_execution_managed`).
3. THE Refactored_Layout SHALL preserve all lifecycle rules (`prevent_destroy`, `ignore_changes`,
   `create_before_destroy`) exactly as defined in the Flat_Structure.
4. THE Refactored_Layout SHALL preserve the ECS service `enable_execute_command = true` setting
   that enables SSM Session Manager access for debugging.
5. IF the existing `aws_ecr_lifecycle_policy` rules for untagged images (expire after 1 day) and
   tagged images (keep last 10) are present in the Flat_Structure, THEN the Compute_Module SHALL
   retain those exact rules.

---

### Requirement 17: Migration Strategy

**User Story:** As an infrastructure engineer, I want a documented migration path from the
current Flat_Structure to the refactored layout, so that the transition can be executed safely
without destroying and re-creating live infrastructure.

#### Acceptance Criteria

1. THE Migration_Plan SHALL document the steps to apply the Bootstrap_Layer first, including
   how to create the S3 bucket and DynamoDB lock table before any state is migrated.
2. THE Migration_Plan SHALL describe how to use `terraform state mv` commands (or equivalent)
   to move existing state resources from the current flat state file into the new per-environment
   per-region state files without destroying and re-creating resources.
3. THE Migration_Plan SHALL specify that the Bootstrap_Layer is applied exactly once per AWS
   account (or once per account-region pair if the bucket is region-specific) and MUST NOT be
   re-applied as part of normal environment deployments.
4. THE Migration_Plan SHALL document the order of module instantiation during first `terraform
   apply` after migration: Bootstrap → Global_Services → Network → Security → Database → IAM
   → Compute → Observability, so that all upstream outputs are available when each module runs.
5. IF an existing resource (e.g. an IAM role) already exists in the AWS account before migration,
   THEN the Migration_Plan SHALL describe how to use `terraform import` to bring that resource
   under the new module's management without re-creating it.

---

### Requirement 18: Future Scalability

**User Story:** As an infrastructure engineer, I want the refactored layout to support adding
new AWS regions with minimal structural change, so that the multi-region footprint can grow
without significant rework.

#### Acceptance Criteria

1. WHEN a new AWS region must be supported, THE Refactored_Layout SHALL require creating only
   one new Environment_Region_Directory (e.g. `terraform/environments/prod/ap-east-1/`) and
   copying the structure from an existing peer directory, with no changes to any module.
2. THE Network_Module SHALL accept `vpc_cidr`, `public_subnet_cidrs`, and
   `private_subnet_cidrs` as input variables (not hard-coded), so that each
   Environment_Region_Directory can supply non-overlapping CIDR ranges when deployed across
   multiple regions.
3. THE Global_Services_Module SHALL be instantiated in only one canonical region per environment
   (the primary region) — this single-region restriction is absolute and applies even for
   disaster recovery scenarios. The `aws_globalaccelerator_endpoint_group` resource within it
   SHALL accept additional endpoint configurations so that new region ALBs can be registered
   without modifying the module interface.
4. THE Database_Module's `secondary_region` input variable SHALL accept any valid AWS region
   string, so that DynamoDB Global Tables replication can be directed to a new region by
   changing only the `terraform.tfvars` of the relevant Environment_Region_Directory.
