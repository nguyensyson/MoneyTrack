output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_public_ips" {
  description = "Elastic IPs of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "private_route_table_ids" {
  description = "IDs of the private route tables (one per AZ)"
  value       = aws_route_table.private[*].id
}

output "vpc_endpoint_sg_id" {
  description = "ID of the VPC endpoint security group"
  value       = aws_security_group.vpc_endpoint.id
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs.id
}
