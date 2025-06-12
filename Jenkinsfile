pipeline {
    agent any

    environment {
        DOCKERHUB_REPO = "andrrade"
        BUILD_TAG = "${env.BUILD_ID}"
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
                            
                            def scanResult = sh(
                                script: "${trivyCmd} image --format json --quiet ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}",
                                returnStdout: true
                            ).trim()
                            
                            def vulnCount = sh(
                                script: """
                                    echo '${scanResult}' | python3 -c "
import json, sys
data = json.load(sys.stdin)
critical = high = medium = low = unknown = 0
for result in data.get('Results', []):
    for vuln in result.get('Vulnerabilities', []):
        severity = vuln.get('Severity', 'UNKNOWN').upper()
        if severity == 'CRITICAL': critical += 1
        elif severity == 'HIGH': high += 1
        elif severity == 'MEDIUM': medium += 1
        elif severity == 'LOW': low += 1
        else: unknown += 1
total = critical + high + medium + low + unknown
print(f'Total: {total} (UNKNOWN: {unknown}, LOW: {low}, MEDIUM: {medium}, HIGH: {high}, CRITICAL: {critical})')
if critical > 0: sys.exit(1)
elif high > 0: sys.exit(2)
                                    " 2>/dev/null || echo "Scan error"
                                """,
                                returnStatus: true
                            )
                            
                            if (vulnCount == 1) {
                                currentBuild.result = 'FAILURE'
                                error("Critical vulnerabilities found in Frontend")
                            } else if (vulnCount == 2) {
                                currentBuild.result = 'UNSTABLE'
                                echo "⚠️ High vulnerabilities found in Frontend"
                            }
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
                            
                            def scanResult = sh(
                                script: "${trivyCmd} image --format json --quiet ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}",
                                returnStdout: true
                            ).trim()
                            
                            def vulnCount = sh(
                                script: """
                                    echo '${scanResult}' | python3 -c "
import json, sys
data = json.load(sys.stdin)
critical = high = medium = low = unknown = 0
for result in data.get('Results', []):
    for vuln in result.get('Vulnerabilities', []):
        severity = vuln.get('Severity', 'UNKNOWN').upper()
        if severity == 'CRITICAL': critical += 1
        elif severity == 'HIGH': high += 1
        elif severity == 'MEDIUM': medium += 1
        elif severity == 'LOW': low += 1
        else: unknown += 1
total = critical + high + medium + low + unknown
print(f'Total: {total} (UNKNOWN: {unknown}, LOW: {low}, MEDIUM: {medium}, HIGH: {high}, CRITICAL: {critical})')
if critical > 0: sys.exit(1)
elif high > 0: sys.exit(2)
                                    " 2>/dev/null || echo "Scan error"
                                """,
                                returnStatus: true
                            )
                            
                            if (vulnCount == 1) {
                                currentBuild.result = 'FAILURE'
                                error("Critical vulnerabilities found in Backend")
                            } else if (vulnCount == 2) {
                                currentBuild.result = 'UNSTABLE'
                                echo "⚠️ High vulnerabilities found in Backend"
                            }
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
            chuckNorris()
            sh 'rm -f ./trivy ./k8s/deployment.tmp.yaml'
        }
        success {
            echo '🚀 Deploy realizado com sucesso!'
            echo "✅ Frontend: ${DOCKERHUB_REPO}/meu-frontend:${BUILD_TAG}"
            echo "✅ Backend: ${DOCKERHUB_REPO}/meu-backend:${BUILD_TAG}"
        }
        failure {
            echo '❌ Build falhou - Vulnerabilidades críticas encontradas'
        }
        unstable {
            echo '⚠️ Build instável - Vulnerabilidades HIGH encontradas'
        }
    }
}
