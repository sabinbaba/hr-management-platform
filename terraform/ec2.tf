resource "aws_instance" "hr_ec2" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.hr_subnet.id
  vpc_security_group_ids = [aws_security_group.hr_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.hr_ec2_profile.name

  tags = {
    Name = "hr-platform-ec2"
  }
}
