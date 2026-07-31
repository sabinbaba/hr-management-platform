pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "hr-ci-${BUILD_NUMBER}"
        DOCKERHUB_USER = "sabinbaba"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Secret Scan (GitLeaks)') {
            steps {
                sh 'docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect --source /repo -v --exit-code 1'
            }
        }

        stage('Dependency Scan (OWASP)') {
            steps {
                sh '''
                    docker run --rm \
                        -v $(pwd)/hr-platform-backend:/src \
                        -v $(pwd)/owasp-reports:/report \
                        owasp/dependency-check:latest \
                        --scan /src \
                        --format "HTML" \
                        --project "hr-platform-backend" \
                        --out /report \
                        --disableAssembly || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'owasp-reports/**', allowEmptyArchive: true
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from test-runner --remove-orphans'
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.ci.yml down -v --remove-orphans'
                    sh 'docker image rm -f $(docker images "hr-ci-*" -q) || true'
                }
            }
        }

        stage('Static Code Analysis (SonarQube)') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        docker run --rm \
                            -v $(pwd):/usr/src \
                            -w /usr/src \
                            sonarsource/sonar-scanner-cli:latest \
                            -Dsonar.host.url=http://sonarqube:9000 \
                            -Dsonar.login=${SONAR_TOKEN} || true
                    '''
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker build -t ${DOCKERHUB_USER}/hr-platform-backend:${BUILD_NUMBER} -t ${DOCKERHUB_USER}/hr-platform-backend:latest ./hr-platform-backend
                        docker push ${DOCKERHUB_USER}/hr-platform-backend:${BUILD_NUMBER}
                        docker push ${DOCKERHUB_USER}/hr-platform-backend:latest

                        docker build -t ${DOCKERHUB_USER}/hr-platform-frontend:${BUILD_NUMBER} -t ${DOCKERHUB_USER}/hr-platform-frontend:latest ./hr-platform-frontend
                        docker push ${DOCKERHUB_USER}/hr-platform-frontend:${BUILD_NUMBER}
                        docker push ${DOCKERHUB_USER}/hr-platform-frontend:latest

                        docker logout
                    '''
                }
            }
        }

        stage('Container Vulnerability Scan (Trivy)') {
            steps {
                sh '''
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        ${DOCKERHUB_USER}/hr-platform-backend:${BUILD_NUMBER}

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        ${DOCKERHUB_USER}/hr-platform-frontend:${BUILD_NUMBER}
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            sh '''
                docker images ${DOCKERHUB_USER}/hr-platform-backend --format "{{.Tag}}" | grep -E "^[0-9]+$" | sort -rn | tail -n +6 | xargs -I {} docker rmi -f ${DOCKERHUB_USER}/hr-platform-backend:{} || true
                docker images ${DOCKERHUB_USER}/hr-platform-frontend --format "{{.Tag}}" | grep -E "^[0-9]+$" | sort -rn | tail -n +6 | xargs -I {} docker rmi -f ${DOCKERHUB_USER}/hr-platform-frontend:{} || true
            '''
        }
        failure {
            echo 'Pipeline failed — check the logs above.'
        }
    }
}
