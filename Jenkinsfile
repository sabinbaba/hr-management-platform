pipeline {
    agent none

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
                stash includes: '**/*', name: 'workspace'
            }
        }

        stage('Run Backend Tests') {
            agent any
            steps {
                unstash 'workspace'
                sh 'docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from test-runner'
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.ci.yml down -v'
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Docker Image') {
                    agent any
                    steps {
                        unstash 'workspace'
                        dir('hr-platform-backend') {
                            sh 'docker build -t hr-platform-backend:${BUILD_NUMBER} .'
                        }
                    }
                }

                stage('Build Frontend Docker Image') {
                    agent any
                    steps {
                        unstash 'workspace'
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
        }
        failure {
            echo 'Pipeline failed — check the logs above.'
        }
    }
}
