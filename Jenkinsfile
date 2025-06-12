pipeline {
    agent any

    environment {
        DOCKERHUB_REPO = "andrrade"  // Substitua pelo seu usuário DockerHub
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
                            // Instala Trivy se não estiver disponível
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    echo "Instalando Trivy..."
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                                fi
                            '''
                            
                            // Cria diretório de cache do Trivy
                            sh "mkdir -p ${TRIVY_CACHE_DIR}"
                            
                            // Scanner de vulnerabilidades para Frontend
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON
                            sh """
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --output frontend-vulnerability-report.json \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Verifica se existem vulnerabilidades críticas
                            script {
                                def frontendVulns = sh(
                                    script: """
                                        trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                            --format json \
                                            --severity CRITICAL \
                                            --quiet \
                                            ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} | \
                                        jq -r '.Results[].Vulnerabilities | length' | \
                                        awk '{sum += \$1} END {print sum+0}'
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                if (frontendVulns.toInteger() > 0) {
                                    echo "⚠️ ATENÇÃO: ${frontendVulns} vulnerabilidades CRÍTICAS encontradas no Frontend!"
                                    currentBuild.result = 'UNSTABLE'
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade crítica encontrada no Frontend"
                                }
                            }
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            // Instala Trivy se não estiver disponível
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    echo "Instalando Trivy..."
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                                fi
                            '''
                            
                            // Cria diretório de cache do Trivy
                            sh "mkdir -p ${TRIVY_CACHE_DIR}"
                            
                            // Scanner de vulnerabilidades para Backend
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON
                            sh """
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --output backend-vulnerability-report.json \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Verifica se existem vulnerabilidades críticas
                            script {
                                def backendVulns = sh(
                                    script: """
                                        trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                            --format json \
                                            --severity CRITICAL \
                                            --quiet \
                                            ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} | \
                                        jq -r '.Results[].Vulnerabilities | length' | \
                                        awk '{sum += \$1} END {print sum+0}'
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                if (backendVulns.toInteger() > 0) {
                                    echo "⚠️ ATENÇÃO: ${backendVulns} vulnerabilidades CRÍTICAS encontradas no Backend!"
                                    currentBuild.result = 'UNSTABLE'
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade crítica encontrada no Backend"
                                }
                            }
                        }
                    }
                }
            }
            post {
                always {
                    // Arquiva os relatórios de vulnerabilidades
                    archiveArtifacts artifacts: '*-vulnerability-report.json', allowEmptyArchive: true
                    
                    // Publica relatórios (se você tiver plugins específicos instalados)
                    // publishHTML([
                    //     allowMissing: false,
                    //     alwaysLinkToLastBuild: true,
                    //     keepAll: true,
                    //     reportDir: '.',
                    //     reportFiles: '*-vulnerability-report.json',
                    //     reportName: 'Trivy Vulnerability Report'
                    // ])
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
            // Limpa cache do Trivy para economizar espaço
            sh "rm -rf ${TRIVY_CACHE_DIR}"
        }
        success {
            echo '🚀 Deploy realizado com sucesso!'
            echo '🔒 Scanner de segurança executado com Trivy!'
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
            echo '🔒 Vulnerabilidades críticas encontradas - revisar relatórios de segurança'
        }
    }
}
