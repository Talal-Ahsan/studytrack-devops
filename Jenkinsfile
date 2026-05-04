pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo 'Stopping old StudyTrack containers'
                sh 'docker compose down || true'
            }
        }

        stage('Build and Start Application') {
            steps {
                echo 'Building and starting StudyTrack application with Docker Compose'
                sh 'docker compose up --build -d'
            }
        }

        stage('Wait for Application') {
            steps {
                echo 'Waiting for StudyTrack health route'
                sh '''
                for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
                    if curl -s http://localhost:3000/health | grep "Application is healthy and running"; then
                        echo "Application is ready"
                        exit 0
                    fi

                    echo "Waiting for app..."
                    sleep 5
                done

                echo "Application did not become ready"
                docker logs studytrack-app || true
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
            sh 'docker compose ps || true'
        }

        success {
            echo 'SUCCESS: Jenkins pipeline completed and all Selenium tests passed.'
        }

        failure {
            echo 'FAILURE: Jenkins pipeline failed.'
            sh 'docker logs studytrack-app || true'
        }
    }
}