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
                            // Instala Trivy se não estiver instalado (sem sudo)
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    echo "Instalando Trivy no diretório local..."
                                    mkdir -p $HOME/bin
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                    export PATH="$HOME/bin:$PATH"
                                    echo "Trivy instalado em $HOME/bin"
                                fi
                            '''
                            
                            echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                            
                            // Primeiro, vamos verificar se a imagem existe e suas informações
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                echo "========================================"
                                echo "INFORMAÇÕES DA IMAGEM FRONTEND"
                                echo "========================================"
                                echo "Imagem: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
                                docker images | grep "${DOCKERHUB_REPO}/meu-frontend" || echo "Imagem não encontrada localmente"
                                echo ""
                                echo "Todas as imagens locais:"
                                docker images
                                echo ""
                                echo "Inspecionando a imagem:"
                                docker inspect ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} | head -20 || echo "Erro ao inspecionar imagem"
                                echo ""
                                echo "Verificando se conseguimos executar um container:"
                                docker run --rm ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} echo "Container OK" || echo "Erro ao executar container"
                            """
                            
                            // Teste manual do Trivy com uma imagem conhecida por ter vulnerabilidades
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                echo "========================================"
                                echo "TESTE COM IMAGEM CONHECIDA VULNERÁVEL"
                                echo "========================================"
                                echo "Testando Trivy com ubuntu:18.04 (conhecida por ter vulnerabilidades):"
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    ubuntu:18.04 || echo "Erro no teste com ubuntu:18.04"
                            """
                            
                            // Scanner da imagem frontend com muito mais debug
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                mkdir -p ${TRIVY_CACHE_DIR}
                                echo "========================================"
                                echo "RELATÓRIO DE VULNERABILIDADES - FRONTEND"
                                echo "========================================"
                                echo "Versão do Trivy:"
                                trivy --version
                                echo ""
                                echo "Executando: trivy image ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
                                echo "Com cache em: ${TRIVY_CACHE_DIR}"
                                echo ""
                                
                                # Primeiro scan com ALL severities para garantir que algo apareça
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                                    --output frontend-scan-all.txt \
                                    --debug \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                
                                echo ""
                                echo "=== SCAN COMPLETO (TODAS AS SEVERIDADES) ==="
                                cat frontend-scan-all.txt
                                echo ""
                                echo "Linhas no arquivo: \$(wc -l < frontend-scan-all.txt)"
                                echo "Tamanho do arquivo: \$(ls -lh frontend-scan-all.txt)"
                                
                                # Segundo scan só com HIGH e CRITICAL
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --output frontend-scan-high.txt \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                
                                echo ""
                                echo "=== SCAN SÓ HIGH/CRITICAL ==="
                                cat frontend-scan-high.txt
                                
                                # Terceiro scan no formato JSON para análise
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --exit-code 0 \
                                    --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                                    --output frontend-scan-debug.json \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                
                                echo ""
                                echo "=== ANÁLISE DO JSON ==="
                                echo "Tamanho do JSON: \$(ls -lh frontend-scan-debug.json)"
                                echo "Resultados encontrados:"
                                cat frontend-scan-debug.json | grep -c '"VulnerabilityID"' || echo "0 vulnerabilidades encontradas"
                            """
                            
                            // Gera relatório JSON para análise posterior (opcional)
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --exit-code 0 \
                                    --severity LOW,MEDIUM,HIGH,CRITICAL \
                                    --output frontend-vulnerabilities.json \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            // Instala Trivy se não estiver instalado (sem sudo)
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    echo "Instalando Trivy no diretório local..."
                                    mkdir -p $HOME/bin
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin
                                    export PATH="$HOME/bin:$PATH"
                                    echo "Trivy instalado em $HOME/bin"
                                fi
                            '''
                            
                            echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                            
                            // Primeiro, vamos verificar se a imagem existe e suas informações
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                echo "======================================="
                                echo "INFORMAÇÕES DA IMAGEM BACKEND"
                                echo "======================================="
                                echo "Imagem: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"
                                docker images | grep "${DOCKERHUB_REPO}/meu-backend" || echo "Imagem não encontrada localmente"
                                echo ""
                                echo "Inspecionando a imagem:"
                                docker inspect ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} | head -20 || echo "Erro ao inspecionar imagem"
                            """
                            
                            // Scanner da imagem backend com saída direta no console
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                mkdir -p ${TRIVY_CACHE_DIR}
                                echo "======================================="
                                echo "RELATÓRIO DE VULNERABILIDADES - BACKEND"
                                echo "======================================="
                                echo "Executando: trivy image ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity LOW,MEDIUM,HIGH,CRITICAL \
                                    --output backend-scan-output.txt \
                                    --debug \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                                echo ""
                                echo "Exibindo resultado do scan:"
                                cat backend-scan-output.txt
                                echo ""
                                echo "Tamanho do arquivo de saída: \$(wc -l < backend-scan-output.txt) linhas"
                            """
                            
                            // Gera relatório JSON para análise posterior (opcional)
                            sh """
                                export PATH="\$HOME/bin:\$PATH"
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --exit-code 0 \
                                    --severity LOW,MEDIUM,HIGH,CRITICAL \
                                    --output backend-vulnerabilities.json \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
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
            archiveArtifacts artifacts: '*-vulnerabilities.json,*-scan-output.txt', allowEmptyArchive: true
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
