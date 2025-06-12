pipeline {
    agent any

    environment {
        DOCKERHUB_REPO = "andrrade"  // Substitua pelo seu usuário DockerHub
        BUILD_TAG = "${env.BUILD_ID}"
        TRIVY_CACHE_DIR = "${env.WORKSPACE}/trivy-cache"
        TRIVY_TEMP_DIR = "${env.WORKSPACE}/trivy-temp"
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
                            // Limpa e prepara ambiente do Trivy
                            sh """
                                rm -rf ${TRIVY_CACHE_DIR}
                                rm -rf ${TRIVY_TEMP_DIR}
                                mkdir -p ${TRIVY_CACHE_DIR}
                                mkdir -p ${TRIVY_TEMP_DIR}
                            """
                            
                            // Instala Trivy localmente se não estiver disponível
                            sh '''
                                if ! command -v trivy &> /dev/null && [ ! -f ./trivy ]; then
                                    echo "🔧 Instalando Trivy localmente..."
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b .
                                    chmod +x ./trivy
                                fi
                            '''
                            
                            // Define o comando trivy
                            def trivyCmd = sh(script: 'command -v trivy', returnStatus: true) == 0 ? 'trivy' : './trivy'
                            
                            // Atualiza base de dados com retry
                            retry(3) {
                                sh """
                                    echo "🔄 Atualizando base de dados do Trivy..."
                                    TMPDIR=${TRIVY_TEMP_DIR} ${trivyCmd} image --download-db-only --cache-dir ${TRIVY_CACHE_DIR}
                                """
                            }
                            
                            // Scanner de vulnerabilidades para Frontend
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                TMPDIR=${TRIVY_TEMP_DIR} ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR} \
                                    --skip-db-update \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON
                            sh """
                                echo "📄 Gerando relatório JSON do Frontend..."
                                TMPDIR=${TRIVY_TEMP_DIR} ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR} \
                                    --skip-db-update \
                                    --format json \
                                    --output frontend-vulnerability-report.json \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Análise detalhada das vulnerabilidades
                            script {
                                def criticalCount = sh(
                                    script: """
                                        if [ -f frontend-vulnerability-report.json ]; then
                                            grep -o '"Severity":"CRITICAL"' frontend-vulnerability-report.json | wc -l || echo "0"
                                        else
                                            echo "0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                def highCount = sh(
                                    script: """
                                        if [ -f frontend-vulnerability-report.json ]; then
                                            grep -o '"Severity":"HIGH"' frontend-vulnerability-report.json | wc -l || echo "0"
                                        else
                                            echo "0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                def totalVulns = criticalCount.toInteger() + highCount.toInteger()
                                
                                echo "🔍 === RELATÓRIO DE SEGURANÇA - FRONTEND ==="
                                echo "📊 Total de vulnerabilidades encontradas: ${totalVulns}"
                                echo "🔴 Vulnerabilidades CRÍTICAS: ${criticalCount}"
                                echo "🟡 Vulnerabilidades HIGH: ${highCount}"
                                
                                // Lista as vulnerabilidades encontradas
                                if (totalVulns > 0) {
                                    echo "📋 Detalhes das vulnerabilidades:"
                                    def vulnDetails = sh(
                                        script: """
                                            if [ -f frontend-vulnerability-report.json ]; then
                                                python3 -c "
import json
import sys
try:
    with open('frontend-vulnerability-report.json', 'r') as f:
        data = json.load(f)
    
    if 'Results' in data and data['Results']:
        for result in data['Results']:
            if 'Vulnerabilities' in result and result['Vulnerabilities']:
                for vuln in result['Vulnerabilities']:
                    severity = vuln.get('Severity', 'N/A')
                    vuln_id = vuln.get('VulnerabilityID', 'N/A')
                    pkg_name = vuln.get('PkgName', 'N/A')
                    title = vuln.get('Title', 'N/A')
                    print(f'  • {severity}: {vuln_id} em {pkg_name} - {title}')
    else:
        print('  Nenhuma vulnerabilidade encontrada no arquivo JSON')
except Exception as e:
    print(f'  Erro ao analisar JSON: {e}')
                                                " 2>/dev/null || echo "  Erro: Python não disponível para análise detalhada"
                                            else
                                                echo "  Arquivo de relatório não encontrado"
                                            fi
                                        """,
                                        returnStdout: true
                                    ).trim()
                                    echo vulnDetails
                                }
                                
                                // Define o status do build baseado nas vulnerabilidades
                                if (criticalCount.toInteger() > 0) {
                                    echo "🚨 FALHA: ${criticalCount} vulnerabilidades CRÍTICAS encontradas no Frontend!"
                                    echo "❌ Build será marcado como FALHADO devido a vulnerabilidades críticas"
                                    currentBuild.result = 'FAILURE'
                                    error("Vulnerabilidades críticas encontradas - build interrompido")
                                } else if (highCount.toInteger() > 0) {
                                    echo "⚠️ ATENÇÃO: ${highCount} vulnerabilidades HIGH encontradas no Frontend!"
                                    echo "🟡 Build será marcado como INSTÁVEL"
                                    currentBuild.result = 'UNSTABLE'
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade crítica ou alta encontrada no Frontend"
                                }
                                echo "============================================="
                            }
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            // Limpa e prepara ambiente do Trivy
                            sh """
                                rm -rf ${TRIVY_CACHE_DIR}-backend
                                rm -rf ${TRIVY_TEMP_DIR}-backend
                                mkdir -p ${TRIVY_CACHE_DIR}-backend
                                mkdir -p ${TRIVY_TEMP_DIR}-backend
                            """
                            
                            // Instala Trivy localmente se não estiver disponível
                            sh '''
                                if ! command -v trivy &> /dev/null && [ ! -f ./trivy ]; then
                                    echo "🔧 Instalando Trivy localmente..."
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b .
                                    chmod +x ./trivy
                                fi
                            '''
                            
                            // Define o comando trivy
                            def trivyCmd = sh(script: 'command -v trivy', returnStatus: true) == 0 ? 'trivy' : './trivy'
                            
                            // Atualiza base de dados com retry
                            retry(3) {
                                sh """
                                    echo "🔄 Atualizando base de dados do Trivy..."
                                    TMPDIR=${TRIVY_TEMP_DIR}-backend ${trivyCmd} image --download-db-only --cache-dir ${TRIVY_CACHE_DIR}-backend
                                """
                            }
                            
                            // Scanner de vulnerabilidades para Backend
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                TMPDIR=${TRIVY_TEMP_DIR}-backend ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR}-backend \
                                    --skip-db-update \
                                    --format table \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON
                            sh """
                                echo "📄 Gerando relatório JSON do Backend..."
                                TMPDIR=${TRIVY_TEMP_DIR}-backend ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR}-backend \
                                    --skip-db-update \
                                    --format json \
                                    --output backend-vulnerability-report.json \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Análise detalhada das vulnerabilidades
                            script {
                                def criticalCount = sh(
                                    script: """
                                        if [ -f backend-vulnerability-report.json ]; then
                                            grep -o '"Severity":"CRITICAL"' backend-vulnerability-report.json | wc -l || echo "0"
                                        else
                                            echo "0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                def highCount = sh(
                                    script: """
                                        if [ -f backend-vulnerability-report.json ]; then
                                            grep -o '"Severity":"HIGH"' backend-vulnerability-report.json | wc -l || echo "0"
                                        else
                                            echo "0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                def totalVulns = criticalCount.toInteger() + highCount.toInteger()
                                
                                echo "🔍 === RELATÓRIO DE SEGURANÇA - BACKEND ==="
                                echo "📊 Total de vulnerabilidades encontradas: ${totalVulns}"
                                echo "🔴 Vulnerabilidades CRÍTICAS: ${criticalCount}"
                                echo "🟡 Vulnerabilidades HIGH: ${highCount}"
                                
                                // Lista as vulnerabilidades encontradas
                                if (totalVulns > 0) {
                                    echo "📋 Detalhes das vulnerabilidades:"
                                    def vulnDetails = sh(
                                        script: """
                                            if [ -f backend-vulnerability-report.json ]; then
                                                python3 -c "
import json
import sys
try:
    with open('backend-vulnerability-report.json', 'r') as f:
        data = json.load(f)
    
    if 'Results' in data and data['Results']:
        for result in data['Results']:
            if 'Vulnerabilities' in result and result['Vulnerabilities']:
                for vuln in result['Vulnerabilities']:
                    severity = vuln.get('Severity', 'N/A')
                    vuln_id = vuln.get('VulnerabilityID', 'N/A')
                    pkg_name = vuln.get('PkgName', 'N/A')
                    title = vuln.get('Title', 'N/A')
                    print(f'  • {severity}: {vuln_id} em {pkg_name} - {title}')
    else:
        print('  Nenhuma vulnerabilidade encontrada no arquivo JSON')
except Exception as e:
    print(f'  Erro ao analisar JSON: {e}')
                                                " 2>/dev/null || echo "  Erro: Python não disponível para análise detalhada"
                                            else
                                                echo "  Arquivo de relatório não encontrado"
                                            fi
                                        """,
                                        returnStdout: true
                                    ).trim()
                                    echo vulnDetails
                                }
                                
                                // Define o status do build baseado nas vulnerabilidades
                                if (criticalCount.toInteger() > 0) {
                                    echo "🚨 FALHA: ${criticalCount} vulnerabilidades CRÍTICAS encontradas no Backend!"
                                    echo "❌ Build será marcado como FALHADO devido a vulnerabilidades críticas"
                                    currentBuild.result = 'FAILURE'
                                    error("Vulnerabilidades críticas encontradas - build interrompido")
                                } else if (highCount.toInteger() > 0) {
                                    echo "⚠️ ATENÇÃO: ${highCount} vulnerabilidades HIGH encontradas no Backend!"
                                    echo "🟡 Build será marcado como INSTÁVEL"
                                    currentBuild.result = 'UNSTABLE'
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade crítica ou alta encontrada no Backend"
                                }
                                echo "============================================="
                            }
                        }
                    }
                }
            }
            post {
                always {
                    // Arquiva os relatórios de vulnerabilidades
                    archiveArtifacts artifacts: '*-vulnerability-report.json', allowEmptyArchive: true
                    
                    // Cria um resumo das vulnerabilidades
                    script {
                        sh """
                            echo "=== RESUMO DE SEGURANÇA ===" > security-summary.txt
                            echo "Data: \$(date)" >> security-summary.txt
                            echo "Build: ${BUILD_TAG}" >> security-summary.txt
                            echo "" >> security-summary.txt
                            
                            # Frontend
                            echo "FRONTEND:" >> security-summary.txt
                            if [ -f frontend-vulnerability-report.json ]; then
                                CRITICAL=\$(grep -o '"Severity":"CRITICAL"' frontend-vulnerability-report.json | wc -l || echo "0")
                                HIGH=\$(grep -o '"Severity":"HIGH"' frontend-vulnerability-report.json | wc -l || echo "0")
                                echo "  - Críticas: \$CRITICAL" >> security-summary.txt
                                echo "  - High: \$HIGH" >> security-summary.txt
                            else
                                echo "  - Não escaneado" >> security-summary.txt
                            fi
                            
                            # Backend
                            echo "BACKEND:" >> security-summary.txt
                            if [ -f backend-vulnerability-report.json ]; then
                                CRITICAL=\$(grep -o '"Severity":"CRITICAL"' backend-vulnerability-report.json | wc -l || echo "0")
                                HIGH=\$(grep -o '"Severity":"HIGH"' backend-vulnerability-report.json | wc -l || echo "0")
                                echo "  - Críticas: \$CRITICAL" >> security-summary.txt
                                echo "  - High: \$HIGH" >> security-summary.txt
                            else
                                echo "  - Não escaneado" >> security-summary.txt
                            fi
                            
                            echo "=========================" >> security-summary.txt
                            cat security-summary.txt
                        """
                    }
                    
                    archiveArtifacts artifacts: 'security-summary.txt', allowEmptyArchive: true
                }
            }
        }
        stage('Deploy no Kubernetes') {
            when {
                not { 
                    anyOf {
                        equals expected: 'FAILURE', actual: currentBuild.result
                        equals expected: 'ABORTED', actual: currentBuild.result
                    }
                }
            }
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
            when {
                not { 
                    anyOf {
                        equals expected: 'FAILURE', actual: currentBuild.result
                        equals expected: 'ABORTED', actual: currentBuild.result
                    }
                }
            }
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
            // Limpa cache do Trivy e arquivos temporários
            sh """
                rm -rf ${TRIVY_CACHE_DIR}*
                rm -rf ${TRIVY_TEMP_DIR}*
                rm -f ./trivy
                rm -f temp-*.json
                rm -f ./k8s/deployment.tmp.yaml
            """
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
            echo '❌ Build falhou!'
            echo '🔍 Possíveis causas:'
            echo '  - Vulnerabilidades críticas encontradas'
            echo '  - Falha no Docker build'
            echo '  - Erro no push para DockerHub'
            echo '  - Problemas no deploy do Kubernetes'
            echo '💡 Verifique os logs e relatórios de segurança'
        }
        unstable {
            echo '⚠️ Build instável - Vulnerabilidades HIGH encontradas'
            echo '🔒 Revisar relatórios de segurança em:'
            echo '  - frontend-vulnerability-report.json'  
            echo '  - backend-vulnerability-report.json'
            echo '  - security-summary.txt'
            echo '💡 Deploy pode prosseguir, mas recomenda-se correção das vulnerabilidades'
        }
    }
}
