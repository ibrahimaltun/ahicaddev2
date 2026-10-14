
Sunucuya docker kurulumu: curl -fsSL https://get.docker.com | sh
Sunucuda Jenkins ayağı kaldırma
1. /opt/jenkins/Dockerfile
'''
FROM jenkins/jenkins:lts-jdk17
USER root
RUN apt-get update && apt-get install -y ca-certificates curl \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
 && echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
 && apt-get update && apt-get install -y docker-ce-cli docker-compose-plugin \
 && rm -rf /var/lib/apt/lists/*
USER jenkins
'''

2. /opt/jenkins/compose.yaml
'''
name: jenkins
services:
  jenkins:
    build: .
    restart: unless-stopped
    ports:
      - "8080:8080"
    group_add:
      - "${DOCKER_GID}"
    volumes:
      - /var/jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
'''

3. Container ayağı kaldır
'''
mkdir -p /var/jenkins_home && chown 1000:1000 /var/jenkins_home
cd /opt/jenkins
echo "DOCKER_GID=$(getent group docker | cut -d: -f3)" > .env
docker compose up -d --build
'''

4. docker ps ile kontrol et sonra şifre al
'''
docker ps
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
'''

5. Alınan şifre ile sırasıyla
   - <sunucu-ip>:8080 adresine git,
   - şifreyi yapıştır
   - Install plugin de
   - kullanıcı ve şifre oluştur
   - ileri, kabul et her şey kuruldu.

6. Adımlara deva...
- Yeni Öğe / New Item -> isim ver Pipeline tipini seç
- Triggers altından "GitHub hook trigger for GITScm polling" seç
- Pipeline başlığı altından "Pipeline Script from SCM" seç SCM git seç
- Repo url ekle, credentials kısmına add de 
