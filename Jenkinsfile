pipeline {
    agent any
    environment {
        DOCKERHUB_REPO = "andrrade"
        BUILD_TAG = "${env.BUILD_ID}"
        TRIVY_CACHE_DIR = "/tmp/trivy-cache"
    }
    stages {
        stage('Build Frontend Docker Image') {
            steps {
                script {
                    frontendapp = docker.build("${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}", '-f ./frontend/Dockerfile ./frontend')
                }
            }
        }
        stage('Build Backend Docker Image') {
            steps {
                script {
                    backendapp = docker.build("${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}", '-f ./backend/Dockerfile ./backend')
                }
            }
        }
        stage('Push Docker Images') {
            parallel {
                stage('Push Frontend') {
                    steps {
                        script {
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
                            docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                                backendapp.push('latest')
                                backendapp.push("${BUILD_TAG}")
                            }
                        }
                    }
                }
            }
        }
        stage('Security Scan with Trivy') {
            parallel {
                stage('Scan Frontend Image') {
                    steps {
                        script {
                            try {
                                // Instala Trivy se não estiver instalado
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "Instalando Trivy no diretório local..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                        chmod +x $HOME/bin/trivy
                                        echo "Trivy instalado em $HOME/bin"
                                    fi
                                '''
                                
                                // Scanner da imagem frontend - apenas output no console
                                echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    echo "=== RELATÓRIO DE VULNERABILIDADES - FRONTEND ==="
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format table \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} || echo "⚠️ Trivy encontrou vulnerabilidades ou teve problemas"
                                    echo "=== FIM DO RELATÓRIO FRONTEND ==="
                                """
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Frontend: ${e.getMessage()}"
                                echo "❌ Scanner Trivy Frontend falhou, mas o pipeline continua"
                            }
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            try {
                                // Instala Trivy se não estiver instalado
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "Instalando Trivy no diretório local..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                        chmod +x $HOME/bin/trivy
                                        echo "Trivy instalado em $HOME/bin"
                                    fi
                                '''
                                
                                // Scanner da imagem backend - apenas output no console
                                echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    echo "=== RELATÓRIO DE VULNERABILIDADES - BACKEND ==="
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format table \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} || echo "⚠️ Trivy encontrou vulnerabilidades ou teve problemas"
                                    echo "=== FIM DO RELATÓRIO BACKEND ==="
                                """
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Backend: ${e.getMessage()}"
                                echo "❌ Scanner Trivy Backend falhou, mas o pipeline continua"
                            }
                        }
                    }
                }
            }
        }
        stage('Deploy no Kubernetes') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://192.168.1.81:6443']) {
                    script {
                        // Copia e substitui os placeholders pelas tags do build atual
                        sh """
                            cp ./k8s/deployment.yaml ./k8s/deployment.tmp.yaml
                            sed -i 's|{{FRONTEND_TAG}}|${BUILD_TAG}|g' ./k8s/deployment.tmp.yaml
                            sed -i 's|{{BACKEND_TAG}}|${BUILD_TAG}|g' ./k8s/deployment.tmp.yaml
                        """
                        sh 'kubectl apply -f ./k8s/deployment.tmp.yaml'
                        sh 'kubectl rollout status deployment/frontend-app'
                        sh 'kubectl rollout status deployment/backend-app'
                    }
                }
            }
        }
        stage('Verificar Deploy') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://192.168.1.81:6443']) {
                    sh 'kubectl get pods -l app=frontend-app'
                    sh 'kubectl get pods -l app=backend-app'
                    sh 'kubectl get services'
                }
            }
        }
    }
    post {
        always {
            chuckNorris()
        }
        success {
            echo '🚀 Deploy realizado com sucesso!'
            echo '🔒 Scanner de segurança executado com sucesso!'
            echo '💪 Chuck Norris aprova seu pipeline DevSecOps!'
            echo "✅ Frontend: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} deployado"
            echo "✅ Backend: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} deployado"
            echo '🌐 Frontend disponível em: http://localhost:30000'
            echo '🔧 Backend disponível em: http://localhost:30001'
        }
        failure {
            echo '❌ Build falhou, mas Chuck Norris nunca desiste!'
            echo '🔍 Chuck Norris está investigando o problema...'
            echo '💡 Verifique: Docker build, DockerHub push, Scanner de segurança ou Kubernetes deploy'
        }
        unstable {
            echo '⚠️ Build instável - Chuck Norris está monitorando'
        }
    }
}
