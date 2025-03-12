packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = ">= 0.3.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-04b4f1a9cf54c11d0"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ami_users" {
  type    = list(string)
  default = ["761018854275"]
}

variable "db_user" {
  type    = string
  default = "root"
}

variable "db_password" {
  type = string
}

variable "app_port" {
  type    = string
  default = "8080"
}

variable "credentials_file" {
  default = "development-creds.json"
}

# GCP Variables
variable "gcp_project_id" {
  type        = string
  description = "GCP Project ID where the image will be created"
}

variable "gcp_zone" {
  type        = string
  description = "GCP Zone where the image build VM will be created"
  default     = "us-east1-d"
}

#AWS Builder
source "amazon-ebs" "aws-image" {
  ami_name      = "csye6225-webapp"
  instance_type = var.instance_type
  region        = var.aws_region
  source_ami    = var.source_ami
  ssh_username  = "ubuntu"
  ami_users     = var.ami_users
}

source "googlecompute" "gcp-image" {
  project_id              = var.bad
  source_image            = "ubuntu-2404-noble-amd64-v20250214"
  source_image_family     = "ubuntu-2404-noble-amd64"
  zone                    = var.gcp_zone
  machine_type            = "n1-standard-1"
  disk_size               = 10
  disk_type               = "pd-standard"
  network                 = "default"
  tags                    = ["csye6225"]
  image_project_id        = var.gcp_project_id
  image_description       = "Custom Ubuntu 20.04 server image"
  image_storage_locations = ["us"]
  image_name              = "csye6225-webapp"
  image_family            = "csye6225-webapp-images"
  ssh_username            = "ubuntu"
}

build {
  sources = ["source.amazon-ebs.aws-image", "source.googlecompute.gcp-image"]

  provisioner "file" {
    source      = "../src" # Go up one directory to find src
    destination = "/tmp/app"
  }

  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nodejs npm mysql-server",
      "sudo systemctl enable mysql",
      "sudo systemctl start mysql",
      # "sudo groupadd csye6225 || true",
      # "sudo useradd -M -s /usr/sbin/nologin -g csye6225 csye6225 || true",
      "sudo mysql -e \"ALTER USER '${var.db_user}'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY '${var.db_password}'; CREATE DATABASE IF NOT EXISTS healthcheck_db; GRANT ALL PRIVILEGES ON healthcheck_db.* TO '${var.db_user}'@'localhost'; FLUSH PRIVILEGES;\"",
      "sudo useradd -r -s /usr/sbin/nologin csye6225 || true",
      "getent group csye6225 || sudo groupadd csye6225",
      "sudo usermod -a -G csye6225 csye6225",
      "sudo mkdir -p /opt/webapp",
      "sudo cp -r /tmp/app/* /opt/webapp"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "sudo bash -c 'echo \"DB_NAME=healthcheck_db\" > /opt/webapp/.env'",
      "sudo bash -c 'echo \"DB_USERNAME=${var.db_user}\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"DB_PASSWORD=${var.db_password}\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"DB_HOST=localhost\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"DB_PORT=3306\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"PORT=${var.app_port}\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"DB_DIALECT=mysql\" >> /opt/webapp/.env'",
      "sudo bash -c 'echo \"NODE_ENV=production\" >> /opt/webapp/.env'",
      "cd /opt/webapp && sudo npm install",
      "sudo cp /opt/webapp/webapp.service /etc/systemd/system/webapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service"
    ]
  }
}
