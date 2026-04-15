variable "access_key" {
  type      = string
  sensitive = true
}

variable "secret_key" {
  type      = string
  sensitive = true
}

variable "instance_name" {
  type = string
}

variable "instance_flavor_name" {
  type = string
}

variable "instance_image_id" {
  type = string
}

variable "administrator_password" {
  type      = string
  sensitive = true
}

variable "network_id" {
  type = string
}

variable "security_group_name" {
  type = string
}

variable "availability_zone" {
  type = string
}