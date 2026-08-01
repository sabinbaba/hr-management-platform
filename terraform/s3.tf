resource "aws_s3_bucket" "hr_uploads" {
  bucket = "hr-platform-uploads"

  tags = {
    Name = "hr-platform-uploads"
  }
}
