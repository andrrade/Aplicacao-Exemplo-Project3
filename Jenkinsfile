pipeline {
    agent any

    environment {
        DOCKERHUB_REPO = "andrrade"
        BUILD_TAG = "${env.BUILD_ID}"
        DISCORD_WEBHOOK = 'https://discordapp.com/api/webhooks/1382761573411721216/7M3tXv4XD7_H3xEjYUJndbOm9sGWkPABuLSvXssREJmWckZ6tYSqn9LYrUN0eFjKEgDX'
    }

    stages {
        stage('Build Images') {
            parallel {
                stage('Frontend') {
                    steps {
                        script {
                            frontendapp = docker.build("${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}", '-f ./frontend/Dockerfile ./frontend')
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        script {
                            backendapp = docker.build("${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}", '-f ./backend/Dockerfile ./backend')
                        }
                    }
                }
            }
        }
        
        stage('Push Images') {
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
        
        stage('Security Scan') {
            parallel {
                stage('Scan Frontend') {
                    steps {
                        script {
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b .
                                fi
                            '''

                            def trivyCmd = sh(script: 'command -v trivy', returnStatus: true) == 0 ? 'trivy' : './trivy'

                            sh """
                                ${trivyCmd} image --format table --exit-code 0 ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}
                            """

                            sh """
                                ${trivyCmd} image --format json --quiet ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG} > frontend-scan.json

                                python3 << 'EOF'
import json
try:
    with open('frontend-scan.json', 'r') as f:
        data = json.load(f)

    critical = high = medium = low = unknown = 0
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities', []):
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

    total = critical + high + medium + low + unknown
    print(f"Frontend - Total: {total} (UNKNOWN: {unknown}, LOW: {low}, MEDIUM: {medium}, HIGH: {high}, CRITICAL: {critical})")
except:
    print("Frontend - Scan error")
EOF
                            """
                        }
                    }
                }

                stage('Scan Backend') {
                    steps {
                        script {
                            sh '''
                                if ! command -v trivy &> /dev/null; then
                                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b .
                                fi
                            '''

                            def trivyCmd = sh(script: 'command -v trivy', returnStatus: true) == 0 ? 'trivy' : './trivy'

                            sh """
                                ${trivyCmd} image --format table --exit-code 0 ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}
                            """

                            sh """
                                ${trivyCmd} image --format json --quiet ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG} > backend-scan.json

                                python3 << 'EOF'
import json
try:
    with open('backend-scan.json', 'r') as f:
        data = json.load(f)

    critical = high = medium = low = unknown = 0
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities', []):
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

    total = critical + high + medium + low + unknown
    print(f"Backend - Total: {total} (UNKNOWN: {unknown}, LOW: {low}, MEDIUM: {medium}, HIGH: {high}, CRITICAL: {critical})")
except:
    print("Backend - Scan error")
EOF
                            """
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
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
                    sh """
                        cp ./k8s/deployment.yaml ./k8s/deployment.tmp.yaml
                        sed -i 's|{{FRONTEND_TAG}}|${BUILD_TAG}|g' ./k8s/deployment.tmp.yaml
                        sed -i 's|{{BACKEND_TAG}}|${BUILD_TAG}|g' ./k8s/deployment.tmp.yaml
                        kubectl apply -f ./k8s/deployment.tmp.yaml
                        kubectl rollout status deployment/frontend-app
                        kubectl rollout status deployment/backend-app
                    """
                }
            }
        }
        
        stage('Verify') {
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
                    sh '''
                        kubectl get pods -l app=frontend-app
                        kubectl get pods -l app=backend-app
                        kubectl get services
                    '''
                }
            }
        }
    }

    post {
        always {
            // Comando fictício para animação, pode remover ou substituir
            echo 'Finalizando pipeline...'
            sh 'rm -f ./trivy ./k8s/deployment.tmp.yaml frontend-scan.json backend-scan.json'
        }
        success {
            echo '🚀 Deploy realizado com sucesso!'
            echo "✅ Frontend: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
            echo "✅ Backend: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"

            discordSend (
                webhookURL: "${DISCORD_WEBHOOK}",
                content: "✅ Build *SUCESSO*!\nFrontend: `${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}`\nBackend: `${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}`"
            )
        }
        failure {
            echo '❌ Build falhou!'

            discordSend (
                webhookURL: "${DISCORD_WEBHOOK}",
                content: "❌ Build *FALHOU!* Verifique o Jenkins para mais detalhes!"
            )
        }
    }
}
