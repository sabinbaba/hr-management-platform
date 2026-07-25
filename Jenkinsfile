pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('hr-platform-backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('hr-platform-backend') {
                    sh 'npm test'
                }
            }
        }

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

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed — check the logs above.'
        }
    }
}
