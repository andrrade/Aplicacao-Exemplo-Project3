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
                            
                            // Scanner de vulnerabilidades para Frontend - SCAN COMPLETO (todas as severidades)
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Frontend..."
                                TMPDIR=${TRIVY_TEMP_DIR} ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR} \
                                    --skip-db-update \
                                    --format table \
                                    --exit-code 0 \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON - TODAS AS SEVERIDADES
                            sh """
                                echo "📄 Gerando relatório JSON do Frontend..."
                                TMPDIR=${TRIVY_TEMP_DIR} ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR} \
                                    --skip-db-update \
                                    --format json \
                                    --output frontend-vulnerability-report.json \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """
                            
                            // Análise detalhada das vulnerabilidades - MÉTODO MELHORADO
                            script {
                                def vulnerabilityAnalysis = sh(
                                    script: """
                                        if [ -f frontend-vulnerability-report.json ]; then
                                            python3 -c "
import json
import sys

try:
    with open('frontend-vulnerability-report.json', 'r') as f:
        data = json.load(f)
    
    # Contadores
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    unknown_count = 0
    total_vulns = 0
    
    # Lista para armazenar detalhes
    vulnerabilities = []
    
    if 'Results' in data and data['Results']:
        for result in data['Results']:
            if 'Vulnerabilities' in result and result['Vulnerabilities']:
                for vuln in result['Vulnerabilities']:
                    total_vulns += 1
                    severity = vuln.get('Severity', 'UNKNOWN').upper()
                    vuln_id = vuln.get('VulnerabilityID', 'N/A')
                    pkg_name = vuln.get('PkgName', 'N/A')
                    title = vuln.get('Title', 'N/A')
                    
                    # Contagem por severidade
                    if severity == 'CRITICAL':
                        critical_count += 1
                    elif severity == 'HIGH':
                        high_count += 1
                    elif severity == 'MEDIUM':
                        medium_count += 1
                    elif severity == 'LOW':
                        low_count += 1
                    else:
                        unknown_count += 1
                    
                    # Adiciona à lista de vulnerabilidades
                    vulnerabilities.append({
                        'severity': severity,
                        'id': vuln_id,
                        'package': pkg_name,
                        'title': title
                    })
    
    # Output em formato que o Jenkins pode processar
    print(f'TOTAL_VULNS={total_vulns}')
    print(f'CRITICAL_COUNT={critical_count}')
    print(f'HIGH_COUNT={high_count}')
    print(f'MEDIUM_COUNT={medium_count}')
    print(f'LOW_COUNT={low_count}')
    print(f'UNKNOWN_COUNT={unknown_count}')
    
    # Lista vulnerabilidades críticas e high
    if critical_count > 0 or high_count > 0:
        print('CRITICAL_HIGH_DETAILS:')
        for vuln in vulnerabilities:
            if vuln['severity'] in ['CRITICAL', 'HIGH']:
                print(f\"  • {vuln['severity']}: {vuln['id']} em {vuln['package']} - {vuln['title']}\")
    
except Exception as e:
    print(f'ERROR: {str(e)}')
    print('TOTAL_VULNS=0')
    print('CRITICAL_COUNT=0')
    print('HIGH_COUNT=0')
    print('MEDIUM_COUNT=0')
    print('LOW_COUNT=0')
    print('UNKNOWN_COUNT=0')
                                            " 2>/dev/null || echo "ERROR: Python não disponível"
                                        else
                                            echo "ERROR: Arquivo frontend-vulnerability-report.json não encontrado"
                                            echo "TOTAL_VULNS=0"
                                            echo "CRITICAL_COUNT=0"
                                            echo "HIGH_COUNT=0"
                                            echo "MEDIUM_COUNT=0"
                                            echo "LOW_COUNT=0"
                                            echo "UNKNOWN_COUNT=0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                // Parse do resultado
                                def vulnData = [:]
                                def vulnDetails = []
                                def inDetails = false
                                
                                vulnerabilityAnalysis.split('\n').each { line ->
                                    if (line.startsWith('CRITICAL_HIGH_DETAILS:')) {
                                        inDetails = true
                                    } else if (inDetails && line.startsWith('  •')) {
                                        vulnDetails.add(line)
                                    } else if (line.contains('=')) {
                                        def parts = line.split('=')
                                        if (parts.length == 2) {
                                            vulnData[parts[0]] = parts[1]
                                        }
                                    }
                                }
                                
                                def totalVulns = vulnData.get('TOTAL_VULNS', '0').toInteger()
                                def criticalCount = vulnData.get('CRITICAL_COUNT', '0').toInteger()
                                def highCount = vulnData.get('HIGH_COUNT', '0').toInteger()
                                def mediumCount = vulnData.get('MEDIUM_COUNT', '0').toInteger()
                                def lowCount = vulnData.get('LOW_COUNT', '0').toInteger()
                                def unknownCount = vulnData.get('UNKNOWN_COUNT', '0').toInteger()
                                
                                echo "🔍 === RELATÓRIO DE SEGURANÇA - FRONTEND ==="
                                echo "📊 Total de vulnerabilidades encontradas: ${totalVulns}"
                                echo "🔴 Vulnerabilidades CRÍTICAS: ${criticalCount}"
                                echo "🟡 Vulnerabilidades HIGH: ${highCount}"
                                echo "🟠 Vulnerabilidades MEDIUM: ${mediumCount}"
                                echo "🟢 Vulnerabilidades LOW: ${lowCount}"
                                if (unknownCount > 0) {
                                    echo "❓ Vulnerabilidades UNKNOWN: ${unknownCount}"
                                }
                                
                                // Lista as vulnerabilidades críticas e high
                                if (criticalCount > 0 || highCount > 0) {
                                    echo "📋 Detalhes das vulnerabilidades CRÍTICAS e HIGH:"
                                    vulnDetails.each { detail ->
                                        echo detail
                                    }
                                }
                                
                                // Define o status do build baseado nas vulnerabilidades
                                if (criticalCount > 0) {
                                    echo "🚨 FALHA: ${criticalCount} vulnerabilidades CRÍTICAS encontradas no Frontend!"
                                    echo "❌ Build será marcado como FALHADO devido a vulnerabilidades críticas"
                                    currentBuild.result = 'FAILURE'
                                    error("Vulnerabilidades críticas encontradas - build interrompido")
                                } else if (highCount > 0) {
                                    echo "⚠️ ATENÇÃO: ${highCount} vulnerabilidades HIGH encontradas no Frontend!"
                                    echo "🟡 Build será marcado como INSTÁVEL"
                                    currentBuild.result = 'UNSTABLE'
                                } else if (totalVulns > 0) {
                                    echo "ℹ️ INFO: ${totalVulns} vulnerabilidades de severidade MEDIUM/LOW encontradas"
                                    echo "✅ Build pode prosseguir - vulnerabilidades não críticas"
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade encontrada no Frontend"
                                }
                                echo "============================================="
                            }
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'frontend-vulnerability-report.json', allowEmptyArchive: true
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
                            
                            // Scanner de vulnerabilidades para Backend - SCAN COMPLETO
                            sh """
                                echo "🔍 Executando scanner de vulnerabilidades no Backend..."
                                TMPDIR=${TRIVY_TEMP_DIR}-backend ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR}-backend \
                                    --skip-db-update \
                                    --format table \
                                    --exit-code 0 \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Gera relatório em formato JSON - TODAS AS SEVERIDADES
                            sh """
                                echo "📄 Gerando relatório JSON do Backend..."
                                TMPDIR=${TRIVY_TEMP_DIR}-backend ${trivyCmd} image \
                                    --cache-dir ${TRIVY_CACHE_DIR}-backend \
                                    --skip-db-update \
                                    --format json \
                                    --output backend-vulnerability-report.json \
                                    --no-progress \
                                    --timeout 10m \
                                    ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """
                            
                            // Análise detalhada das vulnerabilidades - MÉTODO MELHORADO
                            script {
                                def vulnerabilityAnalysis = sh(
                                    script: """
                                        if [ -f backend-vulnerability-report.json ]; then
                                            python3 -c "
import json
import sys

try:
    with open('backend-vulnerability-report.json', 'r') as f:
        data = json.load(f)
    
    # Contadores
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    unknown_count = 0
    total_vulns = 0
    
    # Lista para armazenar detalhes
    vulnerabilities = []
    
    if 'Results' in data and data['Results']:
        for result in data['Results']:
            if 'Vulnerabilities' in result and result['Vulnerabilities']:
                for vuln in result['Vulnerabilities']:
                    total_vulns += 1
                    severity = vuln.get('Severity', 'UNKNOWN').upper()
                    vuln_id = vuln.get('VulnerabilityID', 'N/A')
                    pkg_name = vuln.get('PkgName', 'N/A')
                    title = vuln.get('Title', 'N/A')
                    
                    # Contagem por severidade
                    if severity == 'CRITICAL':
                        critical_count += 1
                    elif severity == 'HIGH':
                        high_count += 1
                    elif severity == 'MEDIUM':
                        medium_count += 1
                    elif severity == 'LOW':
                        low_count += 1
                    else:
                        unknown_count += 1
                    
                    # Adiciona à lista de vulnerabilidades
                    vulnerabilities.append({
                        'severity': severity,
                        'id': vuln_id,
                        'package': pkg_name,
                        'title': title
                    })
    
    # Output em formato que o Jenkins pode processar
    print(f'TOTAL_VULNS={total_vulns}')
    print(f'CRITICAL_COUNT={critical_count}')
    print(f'HIGH_COUNT={high_count}')
    print(f'MEDIUM_COUNT={medium_count}')
    print(f'LOW_COUNT={low_count}')
    print(f'UNKNOWN_COUNT={unknown_count}')
    
    # Lista vulnerabilidades críticas e high
    if critical_count > 0 or high_count > 0:
        print('CRITICAL_HIGH_DETAILS:')
        for vuln in vulnerabilities:
            if vuln['severity'] in ['CRITICAL', 'HIGH']:
                print(f\"  • {vuln['severity']}: {vuln['id']} em {vuln['package']} - {vuln['title']}\")
    
except Exception as e:
    print(f'ERROR: {str(e)}')
    print('TOTAL_VULNS=0')
    print('CRITICAL_COUNT=0')
    print('HIGH_COUNT=0')
    print('MEDIUM_COUNT=0')
    print('LOW_COUNT=0')
    print('UNKNOWN_COUNT=0')
                                            " 2>/dev/null || echo "ERROR: Python não disponível"
                                        else
                                            echo "ERROR: Arquivo backend-vulnerability-report.json não encontrado"
                                            echo "TOTAL_VULNS=0"
                                            echo "CRITICAL_COUNT=0"
                                            echo "HIGH_COUNT=0"
                                            echo "MEDIUM_COUNT=0"
                                            echo "LOW_COUNT=0"
                                            echo "UNKNOWN_COUNT=0"
                                        fi
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                // Parse do resultado
                                def vulnData = [:]
                                def vulnDetails = []
                                def inDetails = false
                                
                                vulnerabilityAnalysis.split('\n').each { line ->
                                    if (line.startsWith('CRITICAL_HIGH_DETAILS:')) {
                                        inDetails = true
                                    } else if (inDetails && line.startsWith('  •')) {
                                        vulnDetails.add(line)
                                    } else if (line.contains('=')) {
                                        def parts = line.split('=')
                                        if (parts.length == 2) {
                                            vulnData[parts[0]] = parts[1]
                                        }
                                    }
                                }
                                
                                def totalVulns = vulnData.get('TOTAL_VULNS', '0').toInteger()
                                def criticalCount = vulnData.get('CRITICAL_COUNT', '0').toInteger()
                                def highCount = vulnData.get('HIGH_COUNT', '0').toInteger()
                                def mediumCount = vulnData.get('MEDIUM_COUNT', '0').toInteger()
                                def lowCount = vulnData.get('LOW_COUNT', '0').toInteger()
                                def unknownCount = vulnData.get('UNKNOWN_COUNT', '0').toInteger()
                                
                                echo "🔍 === RELATÓRIO DE SEGURANÇA - BACKEND ==="
                                echo "📊 Total de vulnerabilidades encontradas: ${totalVulns}"
                                echo "🔴 Vulnerabilidades CRÍTICAS: ${criticalCount}"
                                echo "🟡 Vulnerabilidades HIGH: ${highCount}"
                                echo "🟠 Vulnerabilidades MEDIUM: ${mediumCount}"
                                echo "🟢 Vulnerabilidades LOW: ${lowCount}"
                                if (unknownCount > 0) {
                                    echo "❓ Vulnerabilidades UNKNOWN: ${unknownCount}"
                                }
                                
                                // Lista as vulnerabilidades críticas e high
                                if (criticalCount > 0 || highCount > 0) {
                                    echo "📋 Detalhes das vulnerabilidades CRÍTICAS e HIGH:"
                                    vulnDetails.each { detail ->
                                        echo detail
                                    }
                                }
                                
                                // Define o status do build baseado nas vulnerabilidades
                                if (criticalCount > 0) {
                                    echo "🚨 FALHA: ${criticalCount} vulnerabilidades CRÍTICAS encontradas no Backend!"
                                    echo "❌ Build será marcado como FALHADO devido a vulnerabilidades críticas"
                                    currentBuild.result = 'FAILURE'
                                    error("Vulnerabilidades críticas encontradas - build interrompido")
                                } else if (highCount > 0) {
                                    echo "⚠️ ATENÇÃO: ${highCount} vulnerabilidades HIGH encontradas no Backend!"
                                    echo "🟡 Build será marcado como INSTÁVEL"
                                    currentBuild.result = 'UNSTABLE'
                                } else if (totalVulns > 0) {
                                    echo "ℹ️ INFO: ${totalVulns} vulnerabilidades de severidade MEDIUM/LOW encontradas"
                                    echo "✅ Build pode prosseguir - vulnerabilidades não críticas"
                                } else {
                                    echo "✅ Nenhuma vulnerabilidade encontrada no Backend"
                                }
                                echo "============================================="
                            }
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'backend-vulnerability-report.json', allowEmptyArchive: true
                        }
                    }
                }
            }
        }
        stage('Generate Security Summary') {
            steps {
                script {
                    sh """
                        echo "=== RESUMO DE SEGURANÇA ===" > security-summary.txt
                        echo "Data: \$(date)" >> security-summary.txt
                        echo "Build: ${BUILD_TAG}" >> security-summary.txt
                        echo "" >> security-summary.txt
                        
                        # Função para analisar JSON
                        analyze_json() {
                            local json_file=\$1
                            local component=\$2
                            
                            if [ -f "\$json_file" ]; then
                                python3 -c "
import json
import sys

try:
    with open('\$json_file', 'r') as f:
        data = json.load(f)
    
    critical = high = medium = low = unknown = total = 0
    
    if 'Results' in data and data['Results']:
        for result in data['Results']:
            if 'Vulnerabilities' in result and result['Vulnerabilities']:
                for vuln in result['Vulnerabilities']:
                    total += 1
                    severity = vuln.get('Severity', 'UNKNOWN').upper()
                    if severity == 'CRITICAL':
                        critical += 1
                    elif severity == 'HIGH':
                        high += 1
                    elif severity == 'MEDIUM':
                        medium += 1
                    elif severity == 'LOW':
                        low += 1
                    else:
                        unknown += 1
    
    print(f'\$component:')
    print(f'  - Total: {total}')
    print(f'  - Críticas: {critical}')
    print(f'  - High: {high}')
    print(f'  - Medium: {medium}')
    print(f'  - Low: {low}')
    if unknown > 0:
        print(f'  - Unknown: {unknown}')

except Exception as e:
    print(f'\$component:')
    print(f'  - Erro ao analisar: {str(e)}')
                                " 2>/dev/null || echo "\$component: Erro - Python não disponível"
                            else
                                echo "\$component: Não escaneado"
                            fi
                        }
                        
                        # Análise Frontend e Backend
                        analyze_json "frontend-vulnerability-report.json" "FRONTEND" >> security-summary.txt
                        analyze_json "backend-vulnerability-report.json" "BACKEND" >> security-summary.txt
                        
                        echo "" >> security-summary.txt
                        echo "=========================" >> security-summary.txt
                        cat security-summary.txt
                    """
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
