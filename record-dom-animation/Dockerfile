FROM ubuntu:20.04

RUN apt-get update || : && apt-get install curl -y && \
    curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install nodejs -y && \
    apt-get install ffmpeg -y && \
    curl https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /chrome.deb && \
    dpkg -i /chrome.deb || apt-get install -yf && \
    rm /chrome.deb && \
    apt-get clean

WORKDIR /app

COPY package.json /app
RUN npm install --only=production

COPY server.js /app
COPY renderer.js /app
COPY public/images/wm.png /app
COPY build/ /app/build
COPY gcp-credentials.json /app

EXPOSE 8080

CMD ["npm", "start"]
