pipeline {
    agent any

    stages {
        stage('Run Backend Tests') {
            steps {
                checkout scm
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
                    steps {
                        checkout scm
                        dir('hr-platform-backend') {
                            sh 'docker build -t hr-platform-backend:${BUILD_NUMBER} .'
                        }
                    }
                }

                stage('Build Frontend Docker Image') {
                    steps {
                        checkout scm
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
