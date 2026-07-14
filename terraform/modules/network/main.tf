# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true # Required for VPC Interface Endpoints

  tags = { Name = "${var.project_name}-${var.environment}-vpc" }
}

# =============================================================================
# SUBNETS
# =============================================================================

# Public subnets — NAT Gateway, ALB
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false # ALB and NAT GW get EIPs; no need for auto-assign

  tags = {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Tier = "public"
  }
}

# Private subnets — ECS Fargate tasks
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Tier = "private"
  }
}

# =============================================================================
# INTERNET GATEWAY
# =============================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project_name}-${var.environment}-igw" }
}

# =============================================================================
# NAT GATEWAY (one per AZ for HA — ECS tasks in private subnets need outbound)
# =============================================================================

resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = { Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = { Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}" }

  depends_on = [aws_internet_gateway.main]
}

# =============================================================================
# ROUTE TABLES
# =============================================================================

# Public route table — routes 0.0.0.0/0 through IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route tables — one per AZ, each routes through its own NAT GW
resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = { Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}" }
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# =============================================================================
# VPC ENDPOINTS
# =============================================================================

# Gateway Endpoint for DynamoDB — free, keeps DynamoDB traffic inside AWS network
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.primary_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = { Name = "${var.project_name}-${var.environment}-dynamodb-endpoint" }
}

# Gateway Endpoint for S3 (used by ECR to store image layers)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.primary_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = { Name = "${var.project_name}-${var.environment}-s3-endpoint" }
}

# Interface Endpoint for ECR API — allows ECS in private subnet to pull images
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.primary_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = { Name = "${var.project_name}-${var.environment}-ecr-api-endpoint" }
}

# Interface Endpoint for ECR Docker — allows ECS to pull Docker layers
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.primary_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = { Name = "${var.project_name}-${var.environment}-ecr-dkr-endpoint" }
}

# Interface Endpoint for CloudWatch Logs — allows ECS to push logs without NAT
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.primary_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = { Name = "${var.project_name}-${var.environment}-logs-endpoint" }
}

# Interface Endpoint for Secrets Manager — allows ECS to fetch secrets
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.primary_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = { Name = "${var.project_name}-${var.environment}-secretsmanager-endpoint" }
}

# Interface Endpoint for SSM (Systems Manager)
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.primary_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = { Name = "${var.project_name}-${var.environment}-ssm-endpoint" }
}

# =============================================================================
# SECURITY GROUP — ALB
# Accepts HTTPS (443) from internet; HTTP (80) redirects to HTTPS
# =============================================================================

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Allow HTTP/HTTPS inbound from internet to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-alb-sg" }
}

# =============================================================================
# SECURITY GROUP — ECS Fargate
# Accepts traffic only from ALB on container port
# =============================================================================

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-${var.environment}-ecs-sg"
  description = "Allow inbound from ALB on container port only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound (NAT GW / VPC Endpoints)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-ecs-sg" }
}

# =============================================================================
# SECURITY GROUP — VPC Interface Endpoints
# Accepts HTTPS from ECS tasks inside the VPC
# =============================================================================

resource "aws_security_group" "vpc_endpoint" {
  name        = "${var.project_name}-${var.environment}-vpce-sg"
  description = "Allow HTTPS from ECS tasks to VPC Interface Endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from ECS tasks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-vpce-sg" }
}
