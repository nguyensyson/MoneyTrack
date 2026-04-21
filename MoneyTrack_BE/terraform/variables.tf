# AWS region where all resources will be provisioned
variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "ap-southeast-1"
}

# Application name used as a prefix for resource naming
variable "app_name" {
  description = "Application name used to name AWS resources"
  type        = string
  default     = "moneytrack"
}

# --- Database variables ---

variable "db_name" {
  description = "Name of the MySQL database to create in RDS"
  type        = string
  default     = "moneytrack"
}

variable "db_username" {
  description = "Master username for the RDS MySQL instance"
  type        = string
  default     = "admin"
}

# Sensitive: will not be shown in plan/apply output or state logs
variable "db_password" {
  description = "Master password for the RDS MySQL instance"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class (e.g. db.t3.micro for dev, db.t3.small for staging)"
  type        = string
  default     = "db.t3.micro"
}

# --- Application secrets ---

# Sensitive: will not be shown in plan/apply output or state logs
variable "jwt_secret" {
  description = "Secret key used by the Spring Boot app to sign JWT tokens"
  type        = string
  sensitive   = true
}

# --- ECS task sizing ---

variable "ecs_cpu" {
  description = "CPU units for the ECS Fargate task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory (MB) for the ECS Fargate task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Number of ECS task instances to run"
  type        = number
  default     = 1
}
