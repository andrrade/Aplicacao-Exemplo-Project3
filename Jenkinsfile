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
                                // Instala Trivy se não estiver instalado (sem sudo)
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "Instalando Trivy no diretório local..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                        chmod +x $HOME/bin/trivy
                                        echo "Trivy instalado em $HOME/bin"
                                    fi
                                    echo "Verificando Trivy..."
                                    export PATH="$HOME/bin:$PATH"
                                    trivy --version || echo "Trivy não encontrado"
                                '''
                                
                                // Scanner da imagem frontend
                                sh """
                                    echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    # Executa o scanner com tratamento de erro
                                    set +e
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format table \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        --output frontend-vulnerabilities.txt \
                                        ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                    TRIVY_EXIT_CODE=\$?
                                    set -e
                                    
                                    echo "Trivy exit code: \$TRIVY_EXIT_CODE"
                                    
                                    # Se deu erro, cria um arquivo de fallback
                                    if [ \$TRIVY_EXIT_CODE -ne 0 ]; then
                                        echo "❌ Erro no Trivy Scanner Frontend (exit code: \$TRIVY_EXIT_CODE)" > frontend-vulnerabilities.txt
                                        echo "Continuando pipeline..." >> frontend-vulnerabilities.txt
                                    fi
                                """
                                
                                // Gera relatório JSON para análise posterior
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    set +e
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format json \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        --output frontend-vulnerabilities.json \
                                        ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                    set -e
                                """
                                
                                // Exibe resultado no console
                                sh 'cat frontend-vulnerabilities.txt || echo "Arquivo de vulnerabilidades não encontrado"'
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Frontend: ${e.getMessage()}"
                                sh 'echo "Erro no scanner Trivy Frontend" > frontend-vulnerabilities.txt'
                                // Não falha o build, apenas registra o erro
                            }
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            try {
                                // Instala Trivy se não estiver instalado (sem sudo)
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "Instalando Trivy no diretório local..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                        chmod +x $HOME/bin/trivy
                                        echo "Trivy instalado em $HOME/bin"
                                    fi
                                    echo "Verificando Trivy..."
                                    export PATH="$HOME/bin:$PATH"
                                    trivy --version || echo "Trivy não encontrado"
                                '''
                                
                                // Scanner da imagem backend
                                sh """
                                    echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    # Executa o scanner com tratamento de erro
                                    set +e
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format table \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        --output backend-vulnerabilities.txt \
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                                    TRIVY_EXIT_CODE=\$?
                                    set -e
                                    
                                    echo "Trivy exit code: \$TRIVY_EXIT_CODE"
                                    
                                    # Se deu erro, cria um arquivo de fallback
                                    if [ \$TRIVY_EXIT_CODE -ne 0 ]; then
                                        echo "❌ Erro no Trivy Scanner Backend (exit code: \$TRIVY_EXIT_CODE)" > backend-vulnerabilities.txt
                                        echo "Continuando pipeline..." >> backend-vulnerabilities.txt
                                    fi
                                """
                                
                                // Gera relatório JSON para análise posterior
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    set +e
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                        --format json \
                                        --exit-code 0 \
                                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                                        --output backend-vulnerabilities.json \
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                                    set -e
                                """
                                
                                // Exibe resultado no console
                                sh 'cat backend-vulnerabilities.txt || echo "Arquivo de vulnerabilidades não encontrado"'
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Backend: ${e.getMessage()}"
                                sh 'echo "Erro no scanner Trivy Backend" > backend-vulnerabilities.txt'
                                // Não falha o build, apenas registra o erro
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
            // Arquiva os relatórios de vulnerabilidades
            archiveArtifacts artifacts: '*-vulnerabilities.*', allowEmptyArchive: true
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
