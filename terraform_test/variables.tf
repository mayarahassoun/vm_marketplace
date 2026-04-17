variable "access_key" {
  type = string
}

variable "secret_key" {
  type      = string
  sensitive = true
}

variable "instance_name" {
  type = string
}

variable "instance_image_id" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "administrator_password" {
  type      = string
  sensitive = true
}

variable "subnet_id" {
  type = string
}
variable "system_disk_type" {
  type = string
}

variable "system_disk_size" {
  type = number
}
variable "target_subnet_cidr" {
  type = string
}