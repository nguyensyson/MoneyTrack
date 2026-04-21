# =============================================================================
# NETWORKING
# =============================================================================

# Fetch available AZs in the selected region
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC — primary network for all resources
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# --- Public Subnets (ALB + ECS tasks) ---

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-b"
  }
}

# --- Private Subnets (RDS) ---

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.app_name}-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${var.app_name}-private-b"
  }
}

# --- Internet Gateway ---

# Provides internet access for resources in public subnets
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# --- Public Route Table ---

# Routes all outbound traffic from public subnets through the IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Associate both public subnets with the public route table
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# ALB security group — allows inbound HTTP from the internet (Req 4.4)
resource "aws_security_group" "alb_sg" {
  name        = "${var.app_name}-alb-sg"
  description = "Allow inbound HTTP on port 80 from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# ECS security group — allows inbound on port 8080 from ALB only (Req 4.5)
resource "aws_security_group" "ecs_sg" {
  name        = "${var.app_name}-ecs-sg"
  description = "Allow inbound traffic on port 8080 from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-sg"
  }
}

# RDS security group — allows inbound MySQL on port 3306 from ECS only (Req 5.3)
resource "aws_security_group" "rds_sg" {
  name        = "${var.app_name}-rds-sg"
  description = "Allow inbound MySQL on port 3306 from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from ECS tasks"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}

# =============================================================================
# ECR REPOSITORY (Req 3.4)
# =============================================================================

# ECR repository to store the backend Docker image
resource "aws_ecr_repository" "app" {
  name                 = "moneytrack-be"
  image_tag_mutability = "MUTABLE"

  # Enable vulnerability scanning on every image push
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "moneytrack-be"
  }
}

# =============================================================================
# ECS CLUSTER (Req 3.3)
# =============================================================================

# ECS cluster that will run Fargate tasks for the backend
resource "aws_ecs_cluster" "main" {
  name = "moneytrack-cluster"

  tags = {
    Name = "moneytrack-cluster"
  }
}

# =============================================================================
# IAM — ECS Task Execution Role (Req 3.5)
# =============================================================================

# Trust policy allowing ECS tasks to assume this role
data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# IAM role used by ECS to pull images from ECR and write logs to CloudWatch
resource "aws_iam_role" "ecs_task_execution" {
  name               = "moneytrack-ecsTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = {
    Name = "moneytrack-ecsTaskExecutionRole"
  }
}

# Attach the AWS-managed policy that grants ECR pull and CloudWatch Logs permissions
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# =============================================================================
# ECS TASK DEFINITION (Req 3.6)
# =============================================================================

# Task definition for the MoneyTrack backend running on Fargate
resource "aws_ecs_task_definition" "app" {
  family                   = "moneytrack-be"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "moneytrack-be"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      # DB and app secrets injected as environment variables (Req 3.6)
      environment = [
        {
          name  = "SPRING_DATASOURCE_URL"
          # RDS endpoint injected at deploy time (Req 3.6)
          value = "jdbc:mysql://${aws_db_instance.mysql.address}:3306/${var.db_name}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
        },
        {
          name  = "SPRING_DATASOURCE_USERNAME"
          value = var.db_username
        },
        {
          name  = "SPRING_DATASOURCE_PASSWORD"
          value = var.db_password
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/moneytrack-be"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "moneytrack-be-task"
  }
}

# CloudWatch log group for ECS container logs
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/moneytrack-be"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-ecs-logs"
  }
}

# =============================================================================
# RDS MYSQL (Req 5.1 – 5.5)
# =============================================================================

# DB subnet group — places RDS in private subnets, not directly internet-accessible (Req 5.2)
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

# RDS MySQL 8.0 instance — managed, persistent database for the backend (Req 5.1)
resource "aws_db_instance" "mysql" {
  identifier        = "${var.app_name}-mysql"
  engine            = "mysql"
  engine_version    = "8.0"

  # Instance class is configurable; defaults to db.t3.micro for cost efficiency (Req 5.5)
  instance_class    = var.db_instance_class

  allocated_storage = 20
  storage_type      = "gp2"

  # Database credentials from variables — no hardcoded secrets (Req 5.4)
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Place in private subnets via the subnet group (Req 5.2)
  db_subnet_group_name = aws_db_subnet_group.main.name

  # Restrict access to ECS tasks only via rds-sg (Req 5.3)
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  # Not directly reachable from the internet (Req 5.2)
  publicly_accessible = false

  # Skip final snapshot for dev/staging; set to false for production
  skip_final_snapshot = true

  # Disable multi-AZ for dev/staging cost savings
  multi_az = false

  tags = {
    Name = "${var.app_name}-mysql"
  }
}

# =============================================================================
# APPLICATION LOAD BALANCER (Req 4.1, 4.2, 4.3)
# =============================================================================

# Internet-facing ALB in public subnets — entry point for all API traffic (Req 4.1)
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "${var.app_name}-alb"
  }
}

# Target group — routes traffic to ECS tasks on port 8080 (Req 4.3)
resource "aws_lb_target_group" "app" {
  name        = "${var.app_name}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Required for Fargate awsvpc network mode

  health_check {
    path                = "/"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-399"
  }

  tags = {
    Name = "${var.app_name}-tg"
  }
}

# HTTP listener on port 80 — forwards all traffic to the target group (Req 4.2)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# =============================================================================
# ECS SERVICE (Req 3.7, 3.8)
# =============================================================================

# ECS Fargate service — runs the backend tasks and registers them with the ALB (Req 3.7, 3.8)
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  # Allow Terraform to update the service without forcing a new deployment on every plan
  force_new_deployment = true

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true # Tasks need a public IP to pull images from ECR (Req 3.7)
  }

  # Register tasks with the ALB target group (Req 3.8)
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "moneytrack-be"
    container_port   = 8080
  }

  # Give the app time to start before ALB health checks begin
  health_check_grace_period_seconds = 60

  # Ensure the listener exists before the service tries to register with the target group
  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "${var.app_name}-service"
  }
}
