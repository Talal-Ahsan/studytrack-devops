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

            emailext(
                subject: "SUCCESS: StudyTrack Jenkins Pipeline #${BUILD_NUMBER}",
                mimeType: 'text/html',
                body: """
                <h2>StudyTrack Jenkins Pipeline Successful</h2>

                <p>The Jenkins pipeline completed successfully after a GitHub push.</p>

                <h3>Pipeline Summary</h3>
                <ul>
                    <li>GitHub repository code was checked out successfully.</li>
                    <li>Old Docker containers were removed.</li>
                    <li>Application was built using Docker.</li>
                    <li>Application and MySQL database were started using Docker Compose.</li>
                    <li>Application health route was verified successfully.</li>
                    <li>Selenium dependencies were installed.</li>
                    <li>All 15 Selenium test cases passed.</li>
                    <li>Test results were archived in Jenkins.</li>
                </ul>

                <h3>Build Information</h3>
                <p><b>Build Number:</b> ${BUILD_NUMBER}</p>
                <p><b>Build URL:</b> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                <p><b>Deployment URL:</b> <a href="http://32.236.40.56:3000">http://32.236.40.56:3000</a></p>
                <p><b>GitHub Repository:</b> <a href="https://github.com/Talal-Ahsan/studytrack-devops">https://github.com/Talal-Ahsan/studytrack-devops</a></p>

                <h3>Test Result</h3>
                <p><b>Result:</b> 15 Selenium test cases passed successfully.</p>
                """,
                recipientProviders: [developers(), requestor()]
            )
        }

        failure {
            echo 'FAILURE: Jenkins pipeline failed.'

            echo 'StudyTrack app logs'
            sh 'docker logs studytrack-app || true'

            echo 'StudyTrack MySQL logs'
            sh 'docker logs studytrack-mysql || true'

            emailext(
                subject: "FAILURE: StudyTrack Jenkins Pipeline #${BUILD_NUMBER}",
                mimeType: 'text/html',
                body: """
                <h2>StudyTrack Jenkins Pipeline Failed</h2>

                <p>The Jenkins pipeline failed after a GitHub push.</p>

                <h3>Build Information</h3>
                <p><b>Build Number:</b> ${BUILD_NUMBER}</p>
                <p><b>Build URL:</b> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                <p><b>GitHub Repository:</b> <a href="https://github.com/Talal-Ahsan/studytrack-devops">https://github.com/Talal-Ahsan/studytrack-devops</a></p>

                <h3>Possible Causes</h3>
                <ul>
                    <li>Docker container failed to start.</li>
                    <li>MySQL database container failed.</li>
                    <li>Application health check failed.</li>
                    <li>Selenium tests failed.</li>
                    <li>Dependency installation failed.</li>
                </ul>

                <p>Please check the Jenkins console output for full details.</p>
                """,
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}