# 📦 Repositório Complementar – Project3 Compass UOL DevSecOps

Este repositório foi criado para complementar o projeto principal: [Project3-CompassUOL-DevSecOps](https://github.com/andrrade/Project3-CompassUOL-DevSecOps).
Ele contém os arquivos e estruturas necessários para a implementação completa das soluções backend, frontend, infraestrutura com Kubernetes e integração contínua com Jenkins.

---

## 📑 Sumário

- [🖥️ Backend](https://github.com/andrrade/Aplicacao-Exemplo-Project3/tree/main/backend)

  - [main.py](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/backend/main.py): Arquivo principal da aplicação backend em Python.
  - [Dockerfile](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/backend/Dockerfile): Imagem Docker para o serviço backend.
  - [requirements.txt](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/backend/requirements.txt): Lista de dependências Python para o backend.

- [🎨 Frontend](https://github.com/andrrade/Aplicacao-Exemplo-Project3/tree/main/frontend)

  - [Dockerfile](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/frontend/Dockerfile): Imagem Docker para o frontend.
  - [App.css](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/frontend/src/App.css): Estilos da interface.
  - [App.js](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/frontend/src/App.js): Componente principal do frontend em React (ou similar).

- 🐳 Orquestração

  - [docker-compose.yaml](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/docker-compose.yml): Composição dos serviços para ambiente local com Docker Compose.
  
- [☸️ Kubernetes](https://github.com/andrrade/Aplicacao-Exemplo-Project3/tree/main/k8s)

  - [deployment.yaml](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/k8s/deployment.yaml): Arquivo de configuração para o deploy dos serviços no cluster Kubernetes.

- ⚙️ Integração Contínua

  - [Jenkinsfile](https://github.com/andrrade/Aplicacao-Exemplo-Project3/blob/main/Jenkinsfile): Pipeline automatizado para build, testes e deploy.
