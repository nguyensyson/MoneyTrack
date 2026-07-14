# =============================================================================
# dev / ap-northeast-1 — Root Module (Secondary Region)
#
# Instantiates 6 modules (no global_services — cross-region values supplied as vars).
# Cross-region inputs (certificate_arn, jwt_secret_arn, alb_logs_bucket_id) must
# be populated from the dev/ap-southeast-1 terraform output before applying.
# Apply order: database → network → iam → compute → security → observability
# =============================================================================

module "database" {
  source = "../../../modules/database"

  project_name                    = var.project_name
  environment                     = var.environment
  secondary_region                = var.secondary_region
  dynamodb_enable_global_tables   = var.dynamodb_enable_global_tables
  dynamodb_point_in_time_recovery = var.dynamodb_point_in_time_recovery
  dynamodb_table_users            = var.dynamodb_table_users
  dynamodb_table_categories       = var.dynamodb_table_categories
  dynamodb_table_transactions     = var.dynamodb_table_transactions
}

module "network" {
  source = "../../../modules/network"

  project_name         = var.project_name
  environment          = var.environment
  primary_region       = var.primary_region
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  container_port       = var.container_port
}

module "iam" {
  source = "../../../modules/iam"

  project_name                = var.project_name
  environment                 = var.environment
  primary_region              = var.primary_region
  github_org                  = var.github_org
  github_repo                 = var.github_repo
  create_github_oidc_provider = var.create_github_oidc_provider
  jwt_secret_arn              = var.jwt_secret_arn # sourced from primary region output
  dynamodb_table_arns = [
    module.database.users_table_arn,
    module.database.categories_table_arn,
    module.database.transactions_table_arn,
  ]
  ecr_repository_arn = module.compute.ecr_repository_arn
}

module "compute" {
  source = "../../../modules/compute"

  project_name                = var.project_name
  environment                 = var.environment
  primary_region              = var.primary_region
  ecr_image_tag_mutability    = var.ecr_image_tag_mutability
  ecs_cpu                     = var.ecs_cpu
  ecs_memory                  = var.ecs_memory
  ecs_desired_count           = var.ecs_desired_count
  ecs_min_capacity            = var.ecs_min_capacity
  ecs_max_capacity            = var.ecs_max_capacity
  container_port              = var.container_port
  backend_image_tag           = var.backend_image_tag
  log_retention_days          = var.log_retention_days
  dynamodb_table_users        = var.dynamodb_table_users
  dynamodb_table_categories   = var.dynamodb_table_categories
  dynamodb_table_transactions = var.dynamodb_table_transactions

  # Cross-module inputs from network module
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  alb_sg_id          = module.network.alb_sg_id
  ecs_sg_id          = module.network.ecs_sg_id

  # Cross-module inputs from iam module
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn

  # Cross-region inputs from primary region (dev/ap-southeast-1) terraform output
  certificate_arn    = var.certificate_arn    # sourced from primary region output
  jwt_secret_arn     = var.jwt_secret_arn     # sourced from primary region output
  alb_logs_bucket_id = var.alb_logs_bucket_id # sourced from primary region output
}

module "security" {
  source = "../../../modules/security"

  project_name   = var.project_name
  environment    = var.environment
  alb_arn        = module.compute.alb_arn
  waf_rate_limit = var.waf_rate_limit
}

module "observability" {
  source = "../../../modules/observability"

  project_name     = var.project_name
  environment      = var.environment
  primary_region   = var.primary_region
  ecs_cluster_name = module.compute.ecs_cluster_name
  ecs_service_name = module.compute.ecs_service_name
  alb_arn_suffix   = module.compute.alb_arn_suffix
  alert_email      = var.alert_email
}
