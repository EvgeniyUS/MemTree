# MemTree

A simple application for text notes.

[Hosted on Ubuntu 22.04](https://84.38.182.234/)

For self-hosted enter your server address in the file `ansible/hosts` and:

  ```
  ssh-copy-id <your_admin_user>@<your_server_address>
  cd ansible
  ansible-playbook -i hosts provision.yaml
  ```
