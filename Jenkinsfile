pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "hr-ci-${BUILD_NUMBER}"
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

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Docker Image') {
                    steps {
                        dir('hr-platform-backend') {
                            sh 'docker build -t hr-platform-backend:${BUILD_NUMBER} .'
                        }
                    }
                }

                stage('Build Frontend Docker Image') {
                    steps {
                        dir('hr-platform-frontend') {
                            sh 'docker build -t hr-platform-frontend:${BUILD_NUMBER} .'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            sh '''
                docker images hr-platform-backend --format "{{.Tag}}" | grep -E "^[0-9]+$" | sort -rn | tail -n +6 | xargs -I {} docker rmi -f hr-platform-backend:{} || true
                docker images hr-platform-frontend --format "{{.Tag}}" | grep -E "^[0-9]+$" | sort -rn | tail -n +6 | xargs -I {} docker rmi -f hr-platform-frontend:{} || true
            '''
        }
        failure {
            echo 'Pipeline failed — check the logs above.'
        }
    }
}
