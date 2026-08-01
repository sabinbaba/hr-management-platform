resource "aws_iam_role" "hr_ec2_role" {
  name = "hr-platform-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "hr-platform-ec2-role"
  }
}

resource "aws_iam_instance_profile" "hr_ec2_profile" {
  name = "hr-platform-ec2-profile"
  role = aws_iam_role.hr_ec2_role.name
}
