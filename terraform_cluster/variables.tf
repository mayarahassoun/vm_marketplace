variable "access_key" {
  type = string
}

variable "secret_key" {
  type      = string
  sensitive = true
}

variable "cluster_name" {
  type = string
}

variable "image_id" {
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

variable "availability_zone" {
  type = string
}

variable "master_flavor_id" {
  type = string
}

variable "worker_flavor_id" {
  type = string
}

variable "system_disk_type" {
  type    = string
  default = "SSD"
}

variable "system_disk_size" {
  type    = number
  default = 50
}

variable "worker_count" {
  type    = number
  default = 2
}

variable "ssh_public_key" {
  description = "SSH public key injected into nodes via cloud-config"
  type        = string
}

variable "self_healing_hub_ip" {
  type    = string
  default = ""
}
