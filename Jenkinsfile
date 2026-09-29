pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'ahicadde'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Repository checkout ediliyor...'
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                echo 'Docker Compose configuration kontrol ediliyor...'
                sh 'docker compose config'
            }
        }

        stage('Build') {
            steps {
                echo 'Production Docker image\'ları build ediliyor...'
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Ahicadde production stack deploy ediliyor...'
                sh 'docker compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                echo 'Servislerin sağlık durumu kontrol ediliyor...'

                sh '''
                    set -e

                    echo "Container durumları:"
                    docker compose ps

                    echo "Frontend kontrolü..."
                    docker compose exec -T frontend wget -q --spider http://localhost:3000 || exit 1

                    echo "Backend kontrolü..."
                    docker compose exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

                    echo "Health check başarılı."
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Kullanılmayan Docker image katmanları temizleniyor...'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo 'Ahicadde deployment başarılı.'
        }

        failure {
            echo 'Ahicadde deployment başarısız!'
            sh 'docker compose ps || true'
        }
    }
}