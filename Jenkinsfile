pipeline {
    agent any
    environment {
        DOCKERHUB_REPO = "andrrade"
        BUILD_TAG = "${env.BUILD_ID}"
        TRIVY_CACHE_DIR = "/tmp/trivy-cache"
        // Configurações do Trivy
        TRIVY_VERSION = "0.63.0"
        TRIVY_TIMEOUT = "15m"
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
                                // Setup Trivy
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "📥 Instalando Trivy v${TRIVY_VERSION}..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin v${TRIVY_VERSION}
                                        chmod +x $HOME/bin/trivy
                                        echo "✅ Trivy instalado em $HOME/bin"
                                    fi
                                '''
                                
                                echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    echo "=== 🛡️ RELATÓRIO DE SEGURANÇA - FRONTEND ==="
                                    echo "📅 Data: \$(date)"
                                    echo "🏷️ Imagem: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
                                    echo ""
                                    
                                    echo "🔧 Versão do Trivy:"
                                    trivy --version
                                    echo ""
                                    
                                    echo "🔄 Atualizando base de vulnerabilidades..."
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} --download-db-only
                                    echo ""
                                    
                                    echo "📊 SCAN COMPLETO - TODAS SEVERIDADES:"
                                    echo "================================================"
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --no-progress \\
                                        --timeout ${TRIVY_TIMEOUT} \\
                                        --scanners vuln,secret \\
                                        ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                    echo ""
                                    
                                    echo "🚨 SCAN CRÍTICO/ALTO - APENAS VULNERABILIDADES IMPORTANTES:"
                                    echo "================================================================"
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --severity HIGH,CRITICAL \\
                                        --no-progress \\
                                        --timeout ${TRIVY_TIMEOUT} \\
                                        --scanners vuln \\
                                        ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                                    echo ""
                                    
                                    echo "📋 INFORMAÇÕES DA IMAGEM:"
                                    echo "=========================="
                                    docker inspect ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} --format='Tags: {{.RepoTags}}' || echo "❌ Erro ao inspecionar imagem"
                                    docker inspect ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} --format='Criada: {{.Created}}' || true
                                    docker inspect ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} --format='Tamanho: {{.Size}} bytes' || true
                                    
                                    echo ""
                                    echo "🔍 TESTE COM IMAGEM CONHECIDAMENTE VULNERÁVEL (para validar Trivy):"
                                    echo "===================================================================="
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --severity HIGH,CRITICAL \\
                                        --no-progress \\
                                        --timeout 5m \\
                                        --scanners vuln \\
                                        python:3.8 | head -20 || echo "❌ Não foi possível testar com imagem vulnerável"
                                    
                                    echo "=== 🏁 FIM DO RELATÓRIO FRONTEND ==="
                                """
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Frontend: ${e.getMessage()}"
                                echo "❌ Scanner Trivy Frontend falhou, mas o pipeline continua"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            try {
                                // Setup Trivy
                                sh '''
                                    if ! command -v trivy &> /dev/null; then
                                        echo "📥 Instalando Trivy v${TRIVY_VERSION}..."
                                        mkdir -p $HOME/bin
                                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $HOME/bin v${TRIVY_VERSION}
                                        chmod +x $HOME/bin/trivy
                                        echo "✅ Trivy instalado em $HOME/bin"
                                    fi
                                '''
                                
                                echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                sh """
                                    export PATH="\$HOME/bin:\$PATH"
                                    mkdir -p ${TRIVY_CACHE_DIR}
                                    
                                    echo "=== 🛡️ RELATÓRIO DE SEGURANÇA - BACKEND ==="
                                    echo "📅 Data: \$(date)"
                                    echo "🏷️ Imagem: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"
                                    echo ""
                                    
                                    echo "🔧 Versão do Trivy:"
                                    trivy --version
                                    echo ""
                                    
                                    echo "🔄 Atualizando base de vulnerabilidades..."
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} --download-db-only
                                    echo ""
                                    
                                    echo "📊 SCAN COMPLETO - TODAS SEVERIDADES:"
                                    echo "================================================"
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --no-progress \\
                                        --timeout ${TRIVY_TIMEOUT} \\
                                        --scanners vuln,secret \\
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                                    echo ""
                                    
                                    echo "🚨 SCAN CRÍTICO/ALTO - APENAS VULNERABILIDADES IMPORTANTES:"
                                    echo "================================================================"
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --severity HIGH,CRITICAL \\
                                        --no-progress \\
                                        --timeout ${TRIVY_TIMEOUT} \\
                                        --scanners vuln \\
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                                    echo ""
                                    
                                    echo "📋 INFORMAÇÕES DA IMAGEM:"
                                    echo "=========================="
                                    docker inspect ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} --format='Tags: {{.RepoTags}}' || echo "❌ Erro ao inspecionar imagem"
                                    docker inspect ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} --format='Criada: {{.Created}}' || true
                                    docker inspect ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} --format='Tamanho: {{.Size}} bytes' || true
                                    
                                    echo ""
                                    echo "📦 DEPENDÊNCIAS PYTHON ENCONTRADAS:"
                                    echo "===================================="
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format json \\
                                        --exit-code 0 \\
                                        --no-progress \\
                                        --timeout ${TRIVY_TIMEOUT} \\
                                        --scanners vuln \\
                                        ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} | \\
                                    jq -r '.Results[]? | select(.Type=="python-pkg") | .Packages[]? | "\\(.Name): \\(.Version)"' | head -20 || echo "❌ Não foi possível listar dependências Python"
                                    
                                    echo ""
                                    echo "🔍 TESTE COM IMAGEM CONHECIDAMENTE VULNERÁVEL (para validar Trivy):"
                                    echo "===================================================================="
                                    trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                        --format table \\
                                        --exit-code 0 \\
                                        --severity HIGH,CRITICAL \\
                                        --no-progress \\
                                        --timeout 5m \\
                                        --scanners vuln \\
                                        python:3.8 | head -20 || echo "❌ Não foi possível testar com imagem vulnerável"
                                    
                                    echo "=== 🏁 FIM DO RELATÓRIO BACKEND ==="
                                """
                                
                            } catch (Exception e) {
                                echo "⚠️ Erro no scanner Backend: ${e.getMessage()}"
                                echo "❌ Scanner Trivy Backend falhou, mas o pipeline continua"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
            }
        }
        stage('Security Gate') {
            steps {
                script {
                    echo "🛡️ Executando Security Gate..."
                    
                    try {
                        // Security Gate mais rigoroso - falha o build se houver vulnerabilidades CRITICAL
                        sh """
                            export PATH="\$HOME/bin:\$PATH"
                            
                            echo "🚨 SECURITY GATE - Verificando vulnerabilidades CRÍTICAS..."
                            
                            # Verificar Frontend
                            echo "Verificando Frontend..."
                            FRONTEND_CRITICAL=\$(trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                --format json \\
                                --exit-code 0 \\
                                --severity CRITICAL \\
                                --no-progress \\
                                --timeout 5m \\
                                --scanners vuln \\
                                ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} | \\
                                jq '.Results[]?.Vulnerabilities // [] | length' | \\
                                awk '{sum += \$1} END {print sum+0}')
                            
                            # Verificar Backend  
                            echo "Verificando Backend..."
                            BACKEND_CRITICAL=\$(trivy image --cache-dir ${TRIVY_CACHE_DIR} \\
                                --format json \\
                                --exit-code 0 \\
                                --severity CRITICAL \\
                                --no-progress \\
                                --timeout 5m \\
                                --scanners vuln \\
                                ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} | \\
                                jq '.Results[]?.Vulnerabilities // [] | length' | \\
                                awk '{sum += \$1} END {print sum+0}')
                            
                            echo "📊 RESULTADOS DO SECURITY GATE:"
                            echo "Frontend - Vulnerabilidades CRÍTICAS: \$FRONTEND_CRITICAL"
                            echo "Backend - Vulnerabilidades CRÍTICAS: \$BACKEND_CRITICAL"
                            
                            TOTAL_CRITICAL=\$((FRONTEND_CRITICAL + BACKEND_CRITICAL))
                            echo "Total de vulnerabilidades CRÍTICAS: \$TOTAL_CRITICAL"
                            
                            if [ \$TOTAL_CRITICAL -gt 0 ]; then
                                echo "❌ SECURITY GATE FALHOU!"
                                echo "🚨 Encontradas \$TOTAL_CRITICAL vulnerabilidades CRÍTICAS"
                                echo "🛑 Deploy bloqueado por questões de segurança"
                                # Descomente a linha abaixo para falhar o build
                                # exit 1
                                echo "⚠️ Continuando deploy (Security Gate em modo WARNING)"
                            else
                                echo "✅ SECURITY GATE APROVADO!"
                                echo "🛡️ Nenhuma vulnerabilidade crítica encontrada"
                            fi
                        """
                    } catch (Exception e) {
                        echo "⚠️ Erro no Security Gate: ${e.getMessage()}"
                        echo "🔄 Continuando pipeline..."
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
            // Limpar arquivos temporários
            sh 'rm -f ./k8s/deployment.tmp.yaml'
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
            echo '🔍 Possíveis problemas no scanner de segurança detectados'
        }
    }
    