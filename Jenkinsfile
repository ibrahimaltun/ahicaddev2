pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        githubPush()
    }

    environment {
        COMPOSE_YAML = 'compose.prod.yaml'
        DEPLOY_DIR   = '/opt/ahicaddev2'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Deployment') {
            steps {
                sh '''
                    set -e
                    mkdir -p "${DEPLOY_DIR}"

                    # .env.prod korunur, geri kalan her şey temizlenir
                    find "${DEPLOY_DIR}" -mindepth 1 -maxdepth 1 ! -name '.env.prod' -exec rm -rf {} +

                    cp -a backend frontend docker "${COMPOSE_YAML}" Jenkinsfile "${DEPLOY_DIR}/"
                    ls -la "${DEPLOY_DIR}"
                '''
            }
        }

        stage('Validate Environment') {
            steps {
                sh '''
                    set -e
                    if [ ! -f "${DEPLOY_DIR}/.env.prod" ]; then
                        echo "HATA: ${DEPLOY_DIR}/.env.prod bulunamadi."
                        exit 1
                    fi
                    chmod 600 "${DEPLOY_DIR}/.env.prod"
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set -e
                    cd "${DEPLOY_DIR}"
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod config -q
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    set -e
                    cd "${DEPLOY_DIR}"
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod build
                '''
            }
        }

        stage('Migration') {
            steps {
                sh '''
                    set -e
                    cd "${DEPLOY_DIR}"
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod up -d postgres redis --wait
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod run --rm backend alembic upgrade head
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    cd "${DEPLOY_DIR}"
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod up -d --remove-orphans
                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e
                    cd "${DEPLOY_DIR}"

                    SUCCESS=0
                    for i in $(seq 1 12); do
                        echo "Health check denemesi: ${i}/12"
                        if docker compose -f "${COMPOSE_YAML}" --env-file .env.prod exec -T backend \
                            python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5).read()" \
                            > /dev/null 2>&1
                        then
                            SUCCESS=1
                            break
                        fi
                        sleep 5
                    done

                    if [ "${SUCCESS}" -ne 1 ]; then
                        echo "HATA: Backend health check basarisiz."
                        docker compose -f "${COMPOSE_YAML}" --env-file .env.prod logs --tail=100 backend
                        exit 1
                    fi

                    docker compose -f "${COMPOSE_YAML}" --env-file .env.prod exec -T backend \
                        python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health/db', timeout=10).read().decode())"
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo 'Ahi Cadde production deployment BASARILI.'
        }
        failure {
            echo 'Ahi Cadde production deployment BASARISIZ. Container loglarini kontrol et.'
            sh '''
                cd "${DEPLOY_DIR}" || exit 0
                docker compose -f "${COMPOSE_YAML}" --env-file .env.prod ps || true
                docker compose -f "${COMPOSE_YAML}" --env-file .env.prod logs --tail=50 || true
            '''
        }
    }
}
