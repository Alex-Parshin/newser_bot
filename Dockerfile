FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install puppeteer --unsafe-perm --allow-root

RUN apt-get update
RUN apt-get install -y gnupg
RUN apt-get install -y curl
RUN apt-get install -y gconf-service libx11-xcb1
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -

RUN apt install -y gconf-service libgbm1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

COPY . .
RUN mkdir logs
WORKDIR /usr/src/app/logs
RUN touch newser_server.txt
WORKDIR /usr/src/app
VOLUME /usr/src/app/logs
EXPOSE 3456
CMD ["node", "index.js"]