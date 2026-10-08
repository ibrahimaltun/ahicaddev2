pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'compose.prod.yaml'
        DEPLOY_DIR = '/opt/ahicaddev2'
        POSTGRES_PASSWORD = credentials('prod-postgres-password')
        DATABASE_URL      = credentials('prod-database-url')
        JWT_SECRET        = credentials('prod-jwt-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'GitHub repository checkout ediliyor...'

                checkout scm
            }
        }

        stage('Prepare Deployment') {
            steps {
                echo 'Production deployment dizini hazırlanıyor...'

                sh '''
                    set -e

                    echo "Deployment directory: ${DEPLOY_DIR}"

                    mkdir -p "${DEPLOY_DIR}"

                    echo "Mevcut production dosyaları temizleniyor..."
                    echo "NOT: .env.prod korunacak."

                    find "${DEPLOY_DIR}" \
                        -mindepth 1 \
                        -maxdepth 1 \
                        ! -name '.env.prod' \
                        -exec rm -rf {} +

                    echo "Yeni kaynak kodu deployment dizinine kopyalanıyor..."

                    cp -a \
                        backend \
                        frontend \
                        docker \
                        compose.prod.yaml \
                        Jenkinsfile \
                        "${DEPLOY_DIR}/"

                    echo "Deployment dosyaları:"
                    ls -la "${DEPLOY_DIR}"
                '''
            }
        }

        stage('Validate Production Environment') {
            steps {
                echo 'Production environment kontrol ediliyor...'

                sh '''
                    set -e

                    if [ ! -f "${DEPLOY_DIR}/.env.prod" ]; then
                        echo "HATA: ${DEPLOY_DIR}/.env.prod bulunamadı."
                        echo "Production secret dosyası oluşturulmadan deployment yapılamaz."
                        exit 1
                    fi

                    chmod 600 "${DEPLOY_DIR}/.env.prod"

                    echo "Production .env.prod bulundu."
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                echo 'Production Docker Compose configuration kontrol ediliyor...'

                sh '''
                    set -e

                    cd "${DEPLOY_DIR}"

                    docker compose \
                        -f "${COMPOSE_FILE}" \
                        config
                '''
            }
        }

        stage('Build') {
            steps {
                echo 'Production Docker image build ediliyor...'

                sh '''
                    set -e

                    cd "${DEPLOY_DIR}"

                    docker compose \
                        -f "${COMPOSE_FILE}" \
                        build
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Production stack başlatılıyor...'

                sh '''
                    set -e

                    cd "${DEPLOY_DIR}"
                    
                    POSTGRES_PASSWORD='${POSTGRES_PASSWORD}' \
                    DATABASE_URL='${DATABASE_URL}' \
                    JWT_SECRET='${JWT_SECRET}' \
                    docker compose \
                        -f "${COMPOSE_FILE}" \
                        up -d --remove-orphans
                '''
            }
        }

        stage('Container Status') {
            steps {
                echo 'Production container durumları kontrol ediliyor...'

                sh '''
                    set -e

                    cd "${DEPLOY_DIR}"

                    docker compose \
                        -f "${COMPOSE_FILE}" \
                        ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Production health check başlatılıyor...'

                sh '''
                    set -e

                    cd "${DEPLOY_DIR}"

                    echo "Backend containerının hazır olması bekleniyor..."

                    SUCCESS=0

                    for i in $(seq 1 12); do
                        echo "Health check denemesi: ${i}/12"

                        if docker compose \
                            -f "${COMPOSE_FILE}" \
                            exec -T backend \
                            python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5).read()" \
                            > /dev/null 2>&1
                        then
                            SUCCESS=1
                            echo "Backend health check başarılı."
                            break
                        fi

                        echo "Backend henüz hazır değil. 5 saniye bekleniyor..."
                        sleep 5
                    done

                    if [ "${SUCCESS}" -ne 1 ]; then
                        echo "HATA: Backend health check başarısız."

                        docker compose \
                            -f "${COMPOSE_FILE}" \
                            logs --tail=100 backend

                        exit 1
                    fi

                    echo "Database health endpoint kontrol ediliyor..."

                    docker compose \
                        -f "${COMPOSE_FILE}" \
                        exec -T backend \
                        python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health/db', timeout=10).read().decode())"

                    echo "Backend ve PostgreSQL health check başarılı."
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Kullanılmayan Docker image katmanları temizleniyor...'

                sh '''
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo '''
            ==========================================
            Ahi Cadde production deployment BAŞARILI.
            ==========================================
            '''
        }

        failure {
            echo '''
            ==========================================
            Ahi Cadde production deployment BAŞARISIZ.
            Container logları kontrol edilmeli.
            ==========================================
            '''

            sh '''
                cd "${DEPLOY_DIR}" || true

                docker compose \
                    -f "${COMPOSE_FILE}" \
                    ps || true
            '''
        }
    }
}
