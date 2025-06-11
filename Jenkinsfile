pipeline {
    agent any
    
    triggers {
        pollSCM('* * * * *')
    }
    
    environment {
        DOCKERHUB_REPO = "andrrade"  // Altere para seu usuário do DockerHub
        BUILD_TAG = "${env.BUILD_ID}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Frontend Docker Image') {
            steps {
                script {
                    echo "🔨 Construindo imagem do frontend..."
                    // Adiciona logs para debug
                    sh 'ls -la ./frontend/'
                    sh 'cat ./frontend/package.json'
                    
                    frontendapp = docker.build("${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}", '-f ./frontend/Dockerfile ./frontend')
                }
            }
        }
        
        stage('Build Backend Docker Image') {
            steps {
                script {
                    echo "🔨 Construindo imagem do backend..."
                    sh 'ls -la ./backend/'
                    
                    backendapp = docker.build("${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}", '-f ./backend/Dockerfile ./backend')
                }
            }
        }
        
        stage('Test Docker Images') {
            parallel {
                stage('Test Frontend Image') {
                    steps {
                        script {
                            echo "🧪 Testando imagem do frontend..."
                            // Testa se a imagem foi construída corretamente
                            sh "docker run --rm -d --name test-frontend -p 3001:3000 ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
                            sleep 10
                            // Verifica se o serviço está respondendo
                            sh 'curl -f http://localhost:3001 || exit 1'
                            sh 'docker stop test-frontend'
                        }
                    }
                }
                stage('Test Backend Image') {
                    steps {
                        script {
                            echo "🧪 Testando imagem do backend..."
                            sh "docker run --rm -d --name test-backend -p 8001:8000 ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"
                            sleep 10
                            sh 'curl -f http://localhost:8001 || exit 1'
                            sh 'docker stop test-backend'
                        }
                    }
                }
            }
        }
        
        stage('Push Docker Images') {
            parallel {
                stage('Push Frontend') {
                    steps {
                        script {
                            echo "📤 Enviando imagem do frontend para DockerHub..."
                            docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                                frontendapp.push('latest')
                                frontendapp.push("${BUILD_TAG}")
                            }
                        }
                    }
                }
                stage('Push Backend') {
                    steps {
                        script {
                            echo "📤 Enviando imagem do backend para DockerHub..."
                            docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                                backendapp.push('latest')
                                backendapp.push("${BUILD_TAG}")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Prepare K8s Manifests') {
            steps {
                script {
                    echo "📝 Preparando manifestos do Kubernetes..."
                    
                    // Cria uma cópia do deployment original
                    sh 'cp ./k8s/deployment.yaml ./k8s/deployment-${BUILD_TAG}.yaml'
                    
                    // Atualiza as tags das imagens no deployment
                    sh """
                        sed -i 's|meu-frontend:v1.0.0|${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}|g' ./k8s/deployment-${BUILD_TAG}.yaml
                        sed -i 's|meu-backend:v1.0.0|${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}|g' ./k8s/deployment-${BUILD_TAG}.yaml
                    """
                    
                    // Mostra o arquivo final para debug
                    sh 'echo "=== Arquivo de deployment atualizado ==="'
                    sh 'cat ./k8s/deployment-${BUILD_TAG}.yaml'
                }
            }
        }
        
        stage('Deploy no Kubernetes') {
            environment {
                tag_version = "${BUILD_TAG}"
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://192.168.1.81:6443']) {
                    script {
                        echo "🚀 Fazendo deploy no Kubernetes..."
                        
                        // Verifica se o cluster está acessível
                        sh 'kubectl cluster-info'
                        
                        // Remove deployments anteriores se existirem
                        sh 'kubectl delete deployment frontend-app --ignore-not-found=true'
                        sh 'kubectl delete deployment backend-app --ignore-not-found=true'
                        
                        // Aguarda a remoção completa
                        sleep 10
                        
                        // Aplica o novo deployment
                        sh "kubectl apply -f ./k8s/deployment-${BUILD_TAG}.yaml"
                        
                        // Aguarda o rollout com timeout
                        sh 'kubectl rollout status deployment/frontend-app --timeout=300s'
                        sh 'kubectl rollout status deployment/backend-app --timeout=300s'
                    }
                }
            }
        }
        
        stage('Verificar Deploy') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://192.168.1.81:6443']) {
                    script {
                        echo "🔍 Verificando status do deploy..."
                        
                        sh 'echo "=== PODS FRONTEND ==="'
                        sh 'kubectl get pods -l app=frontend-app -o wide'
                        
                        sh 'echo "=== PODS BACKEND ==="'
                        sh 'kubectl get pods -l app=backend-app -o wide'
                        
                        sh 'echo "=== SERVICES ==="'
                        sh 'kubectl get services'
                        
                        sh 'echo "=== LOGS FRONTEND (últimas 20 linhas) ==="'
                        sh 'kubectl logs -l app=frontend-app --tail=20 || true'
                        
                        sh 'echo "=== LOGS BACKEND (últimas 20 linhas) ==="'
                        sh 'kubectl logs -l app=backend-app --tail=20 || true'
                        
                        // Testa conectividade
                        sh 'echo "=== TESTANDO CONECTIVIDADE ==="'
                        sh 'curl -f http://localhost:30000 || echo "Frontend não está respondendo"'
                        sh 'curl -f http://localhost:30001 || echo "Backend não está respondendo"'
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Limpa imagens Docker locais para economizar espaço
            sh 'docker system prune -f || true'
            
            // Chuck Norris aparece em todos os builds
            chuckNorris()
        }
        success {
            echo '🚀 Deploy realizado com sucesso!'
            echo '💪 Chuck Norris aprova seu pipeline DevSecOps!'
            echo "✅ Frontend: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} deployado"
            echo "✅ Backend: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} deployado"
            echo '🌐 Frontend disponível em: http://localhost:30000'
            echo '🔧 Backend disponível em: http://localhost:30001'
            
            // Envia notificação de sucesso (opcional)
            // emailext subject: "✅ Deploy Realizado com Sucesso - Build #${BUILD_NUMBER}",
            //          body: "Deploy realizado com sucesso!\nFrontend: http://localhost:30000\nBackend: http://localhost:30001",
            //          to: "seu-email@exemplo.com"
        }
        failure {
            echo '❌ Build falhou, mas Chuck Norris nunca desiste!'
            echo '🔍 Chuck Norris está investigando o problema...'
            echo '💡 Verifique: Docker build, DockerHub push ou Kubernetes deploy'
            
            // Coleta logs para debug
            script {
                withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://192.168.1.81:6443']) {
                    sh 'kubectl get events --sort-by=.metadata.creationTimestamp || true'
                    sh 'kubectl describe pods -l app=frontend-app || true'
                    sh 'kubectl describe pods -l app=backend-app || true'
                }
            }
        }
        unstable {
            echo '⚠️ Build instável - Chuck Norris está monitorando'
        }
    }
}
