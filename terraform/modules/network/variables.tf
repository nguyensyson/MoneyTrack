variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "AWS region — used to construct VPC endpoint service_name strings"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
}

variable "container_port" {
  description = "Container port — used in ECS security group ingress rule"
  type        = number
}
