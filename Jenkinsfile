pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm
            }
        }

        stage('Clean Old Containers') {
            steps {
                echo 'Removing old StudyTrack containers and old Compose state'

                sh '''
                docker compose down -v || true

                docker rm -f studytrack-app || true
                docker rm -f studytrack-mysql || true

                docker network rm studytrack-devops_default || true
                docker network rm studytrack-pipeline_default || true

                docker ps -a
                '''
            }
        }

        stage('Build and Start Application') {
            steps {
                echo 'Building and starting StudyTrack application with Docker Compose'

                sh '''
                docker compose up --build -d
                docker ps
                '''
            }
        }

        stage('Wait for Application') {
            steps {
                echo 'Waiting for StudyTrack health route'

                sh '''
                for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
                    if curl -s http://localhost:3000/health | grep "Application is healthy and running"; then
                        echo "Application is ready"
                        exit 0
                    fi

                    echo "Waiting for app..."
                    docker ps
                    sleep 5
                done

                echo "Application did not become ready"
                docker logs studytrack-app || true
                docker logs studytrack-mysql || true
                exit 1
                '''
            }
        }

        stage('Install Selenium Dependencies') {
            steps {
                echo 'Installing Python Selenium dependencies'

                sh '''
                python3 -m venv venv
                . venv/bin/activate
                pip install --upgrade pip
                pip install -r requirements.txt
                '''
            }
        }

        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium test cases'

                sh '''
                . venv/bin/activate
                pytest tests/test_studytrack.py --junitxml=test-results.xml
                '''
            }
        }
    }

    post {
        always {
            echo 'Archiving Selenium test results'
            junit allowEmptyResults: true, testResults: 'test-results.xml'

            echo 'Current Docker Compose status'
            sh 'docker compose ps || true'

            echo 'Current Docker containers'
            sh 'docker ps -a || true'
        }

        success {
            echo 'SUCCESS: Jenkins pipeline completed and all Selenium tests passed.'
        }

        failure {
            echo 'FAILURE: Jenkins pipeline failed.'

            echo 'StudyTrack app logs'
            sh 'docker logs studytrack-app || true'

            echo 'StudyTrack MySQL logs'
            sh 'docker logs studytrack-mysql || true'
        }
    }
}