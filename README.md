# MemTree

A simple web application for text notes.

Try it here - [Hosted on Ubuntu 22.04](https://84.38.182.234/)
- user: test
- password: test


For self-hosted enter your server address in the file `ansible/hosts` and:

  ```
  ssh-copy-id <your_admin_user>@<your_server_address>
  cd ansible
  ansible-playbook -i hosts provision.yaml
  ```
