variable "project_name" {
  description = "Project name — used in resource tags"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region for DynamoDB Global Tables replication"
  type        = string
}

variable "dynamodb_enable_global_tables" {
  description = "Enable DynamoDB Global Tables replication to secondary region"
  type        = bool
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
}

variable "dynamodb_table_users" {
  description = "Name of the DynamoDB users table"
  type        = string
}

variable "dynamodb_table_categories" {
  description = "Name of the DynamoDB categories table"
  type        = string
}

variable "dynamodb_table_transactions" {
  description = "Name of the DynamoDB transactions table"
  type        = string
}
