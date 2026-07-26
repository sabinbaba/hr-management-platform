pipeline {
    agent none

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            agent {
                docker { image 'node:20-slim'; args '-u root:root' }
            }
            steps {
                checkout scm
                sh 'apt-get update -y && apt-get install -y openssl'
                dir('hr-platform-backend') {
                    sh 'npm install'
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Run Backend Tests') {
            agent {
                docker { image 'node:20-slim'; args '-u root:root' }
            }
            steps {
                checkout scm
                sh 'apt-get update -y && apt-get install -y openssl'
                dir('hr-platform-backend') {
                    sh 'npm install'
                    sh 'npx prisma generate'
                    sh 'npm test'
                }
            }
        }

        stage('Build Backend Docker Image') {
            agent any
            steps {
                checkout scm
                dir('hr-platform-backend') {
                    sh 'docker build -t hr-platform-backend:${BUILD_NUMBER} .'
                }
            }
        }

        stage('Build Frontend Docker Image') {
            agent any
            steps {
                checkout scm
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
