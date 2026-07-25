pipeline {
    agent none

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
                stash includes: '**', name: 'source'
            }
        }

        stage('Install Backend Dependencies') {
            agent {
                docker { image 'node:20-slim' }
            }
            steps {
                unstash 'source'
                dir('hr-platform-backend') {
                    sh 'npm install'
                }
                stash includes: 'hr-platform-backend/node_modules/**', name: 'backend-deps'
            }
        }

        stage('Run Backend Tests') {
            agent {
                docker { image 'node:20-slim' }
            }
            steps {
                unstash 'source'
                unstash 'backend-deps'
                dir('hr-platform-backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Backend Docker Image') {
            agent any
            steps {
                unstash 'source'
                dir('hr-platform-backend') {
                    sh 'docker build -t hr-platform-backend:${BUILD_NUMBER} .'
                }
            }
        }

        stage('Build Frontend Docker Image') {
            agent any
            steps {
                unstash 'source'
                dir('hr-platform-frontend') {
                    sh 'docker build -t hr-platform-frontend:${BUILD_NUMBER} .'
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
